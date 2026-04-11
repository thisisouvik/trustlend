import { WorkspaceFrame } from "@/components/dashboard/WorkspaceFrame";
import { requireTradeVaultAdmin } from "@/lib/auth/session";
import {
  getAdminDashboardMetrics,
  presentAdminMetrics,
} from "@/lib/dashboard/metrics";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const { user } = await requireTradeVaultAdmin();
  const metrics = await getAdminDashboardMetrics();

  const supabase = await getServerSupabaseClient();
  const { data: users } = supabase
    ? await supabase
        .from("profiles")
        .select("id, full_name, role, kyc_status, risk_status, created_at")
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] as Array<Record<string, unknown>> };

  return (
    <WorkspaceFrame
      roleLabel="Trade Vault Admin"
      heading="User Governance"
      description="Review user role distribution, KYC state, and high-risk identities."
      email={user.email ?? null}
      userName={String(user.user_metadata?.full_name ?? "Admin")}
      metrics={presentAdminMetrics(metrics)}
      links={[
        { href: "/dashboard/admin", label: "Overview" },
        { href: "/dashboard/admin/loans", label: "Loans" },
        { href: "/dashboard/admin/security", label: "Security" },
      ]}
    >
      <div className="workspace-table-wrap">
        <table className="workspace-table" aria-label="Admin users table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>KYC</th>
              <th>Risk</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="workspace-empty-row">No user records found.</td>
              </tr>
            ) : (
              (users ?? []).map((profile) => (
                <tr key={String(profile.id)}>
                  <td>{String(profile.full_name || String(profile.id).slice(0, 8))}</td>
                  <td>{String(profile.role)}</td>
                  <td>{String(profile.kyc_status)}</td>
                  <td>{String(profile.risk_status)}</td>
                  <td>{profile.created_at ? new Date(String(profile.created_at)).toLocaleDateString() : "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </WorkspaceFrame>
  );
}
