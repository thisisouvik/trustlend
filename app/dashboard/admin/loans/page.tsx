import { WorkspaceFrame } from "@/components/dashboard/WorkspaceFrame";
import { requireTradeVaultAdmin } from "@/lib/auth/session";
import {
  getAdminDashboardMetrics,
  presentAdminMetrics,
} from "@/lib/dashboard/metrics";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminLoansPage() {
  const { user } = await requireTradeVaultAdmin();
  const metrics = await getAdminDashboardMetrics();

  const supabase = await getServerSupabaseClient();
  const { data: loans } = supabase
    ? await supabase
        .from("loans")
        .select("id, borrower_id, status, principal_amount, apr_bps, duration_days, due_at")
        .order("requested_at", { ascending: false })
        .limit(25)
    : { data: [] as Array<Record<string, unknown>> };

  return (
    <WorkspaceFrame
      roleLabel="Trade Vault Admin"
      heading="Loan Operations"
      description="Monitor loan lifecycle, exposure, and maturity timelines across the platform."
      email={user.email ?? null}
      userName={String(user.user_metadata?.full_name ?? "Admin")}
      metrics={presentAdminMetrics(metrics)}
      links={[
        { href: "/dashboard/admin", label: "Overview" },
        { href: "/dashboard/admin/users", label: "Users" },
        { href: "/dashboard/admin/security", label: "Security" },
      ]}
    >
      <div className="workspace-table-wrap">
        <table className="workspace-table" aria-label="Admin loans table">
          <thead>
            <tr>
              <th>Loan</th>
              <th>Borrower</th>
              <th>Status</th>
              <th>Principal</th>
              <th>APR</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {(loans ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="workspace-empty-row">No loan records found.</td>
              </tr>
            ) : (
              (loans ?? []).map((loan) => (
                <tr key={String(loan.id)}>
                  <td>{String(loan.id).slice(0, 8)}</td>
                  <td>{String(loan.borrower_id).slice(0, 8)}</td>
                  <td>{String(loan.status)}</td>
                  <td>{Number(loan.principal_amount ?? 0).toFixed(2)}</td>
                  <td>{(Number(loan.apr_bps ?? 0) / 100).toFixed(2)}%</td>
                  <td>{loan.due_at ? new Date(String(loan.due_at)).toLocaleDateString() : "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </WorkspaceFrame>
  );
}
