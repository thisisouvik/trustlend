import { WorkspaceFrame } from "@/components/dashboard/WorkspaceFrame";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  getLenderDashboardMetrics,
  presentLenderMetrics,
} from "@/lib/dashboard/metrics";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function LenderRiskPage() {
  const { user } = await requireAuthenticatedUser("lender");
  const metrics = await getLenderDashboardMetrics(user.id);

  const supabase = await getServerSupabaseClient();
  const { data: loans } = supabase
    ? await supabase
        .from("loans")
        .select("id, status, principal_amount, due_at")
        .order("due_at", { ascending: true })
        .limit(12)
    : { data: [] as Array<Record<string, unknown>> };

  return (
    <WorkspaceFrame
      roleLabel="Lender Dashboard"
      heading="Risk Monitor"
      description="Monitor loan maturity and defaults to keep portfolio risk within target bounds."
      email={user.email ?? null}
      metrics={presentLenderMetrics(metrics)}
      currentPath="/dashboard/lender/risk"
      links={[
        { href: "/dashboard/lender", label: "Home" },
        { href: "/dashboard/lender/pools", label: "Pools" },
        { href: "/dashboard/lender/portfolio", label: "Portfolio" },
        { href: "/dashboard/lender/risk", label: "Risk" },
        { href: "/dashboard/lender/profile", label: "Settings" },
      ]}
    >
      <div className="workspace-table-wrap">
        <table className="workspace-table" aria-label="Risk monitor loans table">
          <thead>
            <tr>
              <th>Loan</th>
              <th>Status</th>
              <th>Principal</th>
              <th>Due date</th>
            </tr>
          </thead>
          <tbody>
            {(loans ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="workspace-empty-row">No loan risk data available yet.</td>
              </tr>
            ) : (
              (loans ?? []).map((loan) => (
                <tr key={String(loan.id)}>
                  <td>{String(loan.id).slice(0, 8)}</td>
                  <td>{String(loan.status)}</td>
                  <td>{Number(loan.principal_amount ?? 0).toFixed(2)}</td>
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
