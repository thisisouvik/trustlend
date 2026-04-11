import { WorkspaceFrame } from "@/components/dashboard/WorkspaceFrame";
import { requireTradeVaultAdmin } from "@/lib/auth/session";
import {
  getAdminDashboardMetrics,
  presentAdminMetrics,
} from "@/lib/dashboard/metrics";

export default async function AdminDashboardPage() {
  const { user } = await requireTradeVaultAdmin();
  const metrics = await getAdminDashboardMetrics();

  return (
    <WorkspaceFrame
      roleLabel="Trade Vault Admin"
      heading="Control Panel"
      description="Monitor platform health, credit activity, and security posture across TrustLend operations."
      email={user.email ?? null}
      userName={String(user.user_metadata?.full_name ?? "Admin")}
      metrics={presentAdminMetrics(metrics)}
      links={[
        { href: "/dashboard/admin", label: "Overview" },
        { href: "/dashboard/admin/users", label: "Users" },
        { href: "/dashboard/admin/loans", label: "Loans" },
        { href: "/dashboard/admin/security", label: "Security" },
      ]}
    >
      <div className="workspace-grid">
        <article className="workspace-card">
          <h2 className="workspace-card-title">Access boundary</h2>
          <p className="workspace-card-copy">
            This area is restricted to verified Trade Vault operators using server-side auth checks.
          </p>
        </article>
        <article className="workspace-card">
          <h2 className="workspace-card-title">Operations watch</h2>
          <p className="workspace-card-copy">
            Use Users, Loans, and Security views to review risk and platform-level performance.
          </p>
        </article>
      </div>
    </WorkspaceFrame>
  );
}
