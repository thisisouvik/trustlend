import { WorkspaceFrame } from "@/components/dashboard/WorkspaceFrame";
import { BorrowerForms } from "@/components/dashboard/BorrowerForms";
import { FinanceChart } from "@/components/dashboard/FinanceChart";
import { WalletCard } from "@/components/dashboard/WalletCard";
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
        { href: "/dashboard/borrower", label: "Home" },
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

          <article className="workspace-card">
            <h2 className="workspace-card-title">Security Details Needed</h2>
            <p className="workspace-card-copy">Please complete these details to receive loans safely:</p>
            <ul className="workspace-list workspace-list--compact">
              <li><span>Legal full name</span></li>
              <li><span>Primary phone number</span></li>
              <li><span>Government-issued ID</span></li>
              <li><span>Selfie and facial verification</span></li>
              <li><span>Bank statement verification</span></li>
            </ul>
          </article>
        </section>

        <section className="workspace-grid workspace-grid--three">
          <WalletCard
            address={String(user.user_metadata?.wallet_address ?? "") || null}
            available={0}
            inLoansOrPools={inLoansXlm}
            pending={pendingXlm}
            inLoansLabel="In Loans"
          />

          <article className="workspace-card workspace-card--span-2">
            <h2 className="workspace-card-title">Your Verification Status</h2>
            <ul className="workspace-list workspace-list--compact">
              {verificationItems.map((item) => (
                <li key={item.label}>
                  <span>{item.done ? "Yes" : "Pending"} - {item.label}</span>
                  <span className="workspace-muted">{item.day}</span>
                </li>
              ))}
            </ul>
            <p className="workspace-card-copy">Verification Progress: {verificationProgress}%</p>
            <div className="workspace-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={verificationProgress}>
              <span style={{ width: `${verificationProgress}%` }} />
            </div>
            <p className="workspace-card-copy">Estimated completion: {Math.max(0, 30 - monitoringDays)} days</p>
          </article>

          <article className="workspace-card workspace-card--span-3">
            <h2 className="workspace-card-title">Your Loan Profile</h2>
            <div className="workspace-mini-metrics">
              <p>Verified Income: {formatCurrency(1200)} / month</p>
              <p>Credit Score (TrustLend): {metrics.reputationScore}</p>
              <p>Max Loan Amount: {formatCurrency(maxLoanAmount)}</p>
              <p>Active Loans: {activeLoans.length}</p>
              <p>Closed Loans: {closedLoans.length}</p>
              <p>Default History: {closedLoans.some((loan) => loan.status === "defaulted") ? "Has defaults" : "None"}</p>
            </div>
          </article>
        </section>

        <section className="workspace-card">
          <h2 className="workspace-card-title">Your Active Loans</h2>
          {activeLoans.length === 0 ? (
            <p className="workspace-card-copy">
              You have no active loans yet. Complete verification milestones to unlock loan eligibility.
            </p>
          ) : (
            <div className="workspace-table-wrap">
              <table className="workspace-table" aria-label="Active borrower loans">
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>APR</th>
                    <th>Due</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map((loan) => (
                    <tr key={String(loan.id)}>
                      <td>{String(loan.id).slice(0, 8)}</td>
                      <td>{formatCurrency(Number(loan.principal_amount ?? 0))}</td>
                      <td>{String(loan.status).toUpperCase()}</td>
                      <td>{(Number(loan.apr_bps ?? 0) / 100).toFixed(2)}%</td>
                      <td>{loan.due_at ? new Date(String(loan.due_at)).toLocaleDateString() : "-"}</td>
                      <td>
                        <span className="workspace-link-inline">Make Payment</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="workspace-grid workspace-grid--two">
          <BorrowerForms 
            canApplyLoan={canApplyLoan}
            maxLoanAmount={maxLoanAmount}
            selectedRepaymentLoan={selectedRepaymentLoan}
            dueAmount={dueAmount}
          />

          <article className="workspace-card">
            <h2 className="workspace-card-title">Profile & Security</h2>
            <p className="workspace-card-copy">Name: {String(profile?.full_name ?? "Not set")}</p>
            <p className="workspace-card-copy">Email: {user.email ?? "Unknown"}</p>
            <p className="workspace-card-copy">Phone: {String(profile?.phone ?? "Not set")}</p>
            <p className="workspace-card-copy">KYC: {String(profile?.kyc_status ?? "pending")}</p>
            <div className="workspace-inline-actions">
              <button type="button" className="workspace-nav-link">Enable 2FA</button>
              <button type="button" className="workspace-nav-link">Change Password</button>
            </div>
          </article>
        </section>

        <section className="workspace-card">
          <h2 className="workspace-card-title">Help & Support</h2>
          <p className="workspace-card-copy">Email: support@trustlend.com | Live chat: 9AM-6PM UTC</p>
          <div className="workspace-inline-actions">
            <button type="button" className="workspace-nav-link">FAQ</button>
            <button type="button" className="workspace-nav-link">Create Support Ticket</button>
            <button type="button" className="workspace-nav-link">Video Tutorials</button>
          </div>
        </section>
      </div>
    </WorkspaceFrame>
  );
}
