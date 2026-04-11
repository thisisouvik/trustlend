import { WorkspaceFrame } from "@/components/dashboard/WorkspaceFrame";
import { BorrowerForms } from "@/components/dashboard/BorrowerForms";
import { FinanceChart } from "@/components/dashboard/FinanceChart";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableHead, TableTd, TableTh, TableWrap } from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  getBorrowerDashboardMetrics,
  presentBorrowerMetrics,
} from "@/lib/dashboard/metrics";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/formatting";

function daysSince(value: string | null | undefined) {
  if (!value) return 0;
  const start = new Date(value).getTime();
  const diff = Date.now() - start;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export default async function BorrowerDashboardPage() {
  const { user } = await requireAuthenticatedUser("borrower");
  const metrics = await getBorrowerDashboardMetrics(user.id);

  const supabase = await getServerSupabaseClient();

  const [profileRes, loansRes, verificationRes] = supabase
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, phone, country_code, kyc_status, risk_status")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("loans")
          .select("id, status, principal_amount, repaid_amount, apr_bps, duration_days, requested_at, due_at, closed_at")
          .eq("borrower_id", user.id)
          .order("requested_at", { ascending: false })
          .limit(10),
        supabase
          .from("external_verifications")
          .select("verification_type, status")
          .eq("user_id", user.id),
      ])
    : [{ data: null }, { data: [] }, { data: [] }];

  const profile = profileRes.data;
  const loans = loansRes.data ?? [];
  const verifications = verificationRes.data ?? [];

  const verificationMap = new Map(
    verifications.map((item) => [String(item.verification_type), String(item.status)]),
  );

  const monitoringDays = daysSince(user.created_at);
  const monitoringComplete = monitoringDays >= 30;

  const verificationItems = [
    { label: "Email Verified", done: Boolean(user.email_confirmed_at), day: "Day 1" },
    { label: "Phone Verified", done: Boolean(profile?.phone), day: "Day 2" },
    { label: "Government ID Verified", done: verificationMap.get("government_id") === "verified", day: "Day 3" },
    { label: "Facial Recognition OK", done: verificationMap.get("facial_recognition") === "verified", day: "Day 3" },
    { label: "Employment Verified", done: verificationMap.get("employment") === "verified", day: "Day 5" },
    { label: "Bank Data Verified", done: verificationMap.get("bank_data") === "verified", day: "Day 7" },
    { label: "Monitoring Period", done: monitoringComplete, day: `Day ${Math.min(monitoringDays, 30)}/30` },
  ];

  const verificationCompleted = verificationItems.filter((item) => item.done).length;
  const verificationProgress = Math.round((verificationCompleted / verificationItems.length) * 100);

  const activeLoans = loans.filter((loan) => ["approved", "funded", "active"].includes(String(loan.status)));
  const closedLoans = loans.filter((loan) => ["repaid", "defaulted", "cancelled"].includes(String(loan.status)));
  const inLoansXlm = activeLoans.reduce((sum, loan) => sum + Number(loan.principal_amount ?? 0), 0);
  const pendingXlm = loans
    .filter((loan) => String(loan.status) === "requested")
    .reduce((sum, loan) => sum + Number(loan.principal_amount ?? 0), 0);

  const selectedRepaymentLoan = activeLoans[0] ?? null;
  const dueAmount = selectedRepaymentLoan
    ? Math.max(0, Number(selectedRepaymentLoan.principal_amount ?? 0) - Number(selectedRepaymentLoan.repaid_amount ?? 0))
    : 0;

  const canApplyLoan = verificationProgress >= 90 && monitoringComplete;
  const maxLoanAmount = canApplyLoan ? metrics.availableCredit : 0;
  const missingSecurityItems = verificationItems
    .filter((item) => !item.done)
    .map((item) => item.label)
    .slice(0, 4);

  const borrowerChartPoints = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((month, index) => {
    const borrowed = Number(loans[index]?.principal_amount ?? 0);
    const repaid = Number(loans[index]?.repaid_amount ?? 0);
    return {
      label: month,
      valueA: borrowed,
      valueB: repaid,
    };
  });

  return (
    <WorkspaceFrame
      roleLabel="Borrower Dashboard"
      heading="Borrower Home"
      description="Transparent loan visibility, verification progress, and repayment controls in one place."
      email={user.email ?? null}
      metrics={presentBorrowerMetrics(metrics)}
      headerWidget={(
        <WalletCard
          address={String(user.user_metadata?.wallet_address ?? "") || null}
          available={0}
          inLoansOrPools={inLoansXlm}
          pending={pendingXlm}
          inLoansLabel="In Loans"
          compact
        />
      )}
      currentPath="/dashboard/borrower"
      profilePath="/dashboard/borrower/profile"
      profileSummary={{
        completion: verificationProgress,
        kycStatus: String(profile?.kyc_status ?? "pending"),
        warningText: canApplyLoan
          ? "Profile is strong. Keep security details up to date."
          : "Profile is incomplete. Complete security details to unlock borrowing.",
        requiredItems: missingSecurityItems.length > 0
          ? missingSecurityItems
          : ["Enable 2FA", "Keep employment and bank details updated"],
      }}
      links={[
        { href: "/dashboard/borrower", label: "Overview" },
        { href: "/dashboard/borrower/loans", label: "My loans" },
        { href: "/dashboard/borrower/tasks", label: "Tasks" },
        { href: "/dashboard/borrower/profile", label: "Settings" },
      ]}
    >
      <div className="workspace-stack">
        <section className="workspace-grid workspace-grid--three">
          <FinanceChart
            title="Borrowing Trend"
            legendA="Borrowed"
            legendB="Repaid"
            points={borrowerChartPoints}
          />

          <Card>
            <CardHeader>
              <CardTitle>Security Details Needed</CardTitle>
              <CardDescription>Please complete these details to receive loans safely.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>Legal full name</li>
                <li>Primary phone number</li>
                <li>Government-issued ID</li>
                <li>Selfie and facial verification</li>
                <li>Bank statement verification</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="workspace-grid workspace-grid--two">
          <Card className="workspace-card--span-2">
            <CardHeader>
              <CardTitle>Your Verification Status</CardTitle>
            </CardHeader>
            <CardContent>
            <ul className="space-y-2 text-sm text-slate-700">
              {verificationItems.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-3">
                  <span>{item.done ? "Yes" : "Pending"} - {item.label}</span>
                  <span className="text-xs text-slate-500">{item.day}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-600">Verification Progress: {verificationProgress}%</p>
            <Progress value={verificationProgress} className="mt-2" />
            <p className="mt-3 text-sm text-slate-500">Estimated completion: {Math.max(0, 30 - monitoringDays)} days</p>
            </CardContent>
          </Card>

          <Card className="workspace-card--span-3">
            <CardHeader>
              <CardTitle>Your Loan Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Verified Income: {formatCurrency(1200)} / month</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Credit Score: {metrics.reputationScore}</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Max Loan Amount: {formatCurrency(maxLoanAmount)}</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Active Loans: {activeLoans.length}</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Closed Loans: {closedLoans.length}</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Default History: {closedLoans.some((loan) => loan.status === "defaulted") ? "Has defaults" : "None"}</div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Your Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
          {activeLoans.length === 0 ? (
            <p className="text-sm text-slate-600">
              You have no active loans yet. Complete verification milestones to unlock loan eligibility.
            </p>
          ) : (
            <TableWrap>
              <Table aria-label="Active borrower loans">
                <TableHead>
                  <tr>
                    <TableTh>Loan ID</TableTh>
                    <TableTh>Amount</TableTh>
                    <TableTh>Status</TableTh>
                    <TableTh>APR</TableTh>
                    <TableTh>Due</TableTh>
                    <TableTh>Actions</TableTh>
                  </tr>
                </TableHead>
                <TableBody>
                  {activeLoans.map((loan) => (
                    <tr key={String(loan.id)}>
                      <TableTd>{String(loan.id).slice(0, 8)}</TableTd>
                      <TableTd>{formatCurrency(Number(loan.principal_amount ?? 0))}</TableTd>
                      <TableTd><Badge variant="blue">{String(loan.status).toUpperCase()}</Badge></TableTd>
                      <TableTd>{(Number(loan.apr_bps ?? 0) / 100).toFixed(2)}%</TableTd>
                      <TableTd>{loan.due_at ? new Date(String(loan.due_at)).toLocaleDateString() : "-"}</TableTd>
                      <TableTd><Button variant="outline" className="h-8 px-3 text-xs">Make Payment</Button></TableTd>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          )}
          </CardContent>
        </Card>

        <section className="workspace-grid workspace-grid--two">
          <BorrowerForms 
            canApplyLoan={canApplyLoan}
            maxLoanAmount={maxLoanAmount}
            selectedRepaymentLoan={selectedRepaymentLoan}
            dueAmount={dueAmount}
          />

          <Card>
            <CardHeader>
              <CardTitle>Profile & Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-slate-700">
                <p>Name: {String(profile?.full_name ?? "Not set")}</p>
                <p>Email: {user.email ?? "Unknown"}</p>
                <p>Phone: {String(profile?.phone ?? "Not set")}</p>
                <p>KYC: {String(profile?.kyc_status ?? "pending")}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline">Enable 2FA</Button>
                <Button variant="outline">Change Password</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Help & Support</CardTitle>
            <CardDescription>Email: support@trustlend.com | Live chat: 9AM-6PM UTC</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">FAQ</Button>
              <Button variant="outline">Create Support Ticket</Button>
              <Button variant="outline">Video Tutorials</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </WorkspaceFrame>
  );
}
