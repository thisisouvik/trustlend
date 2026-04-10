import { WorkspaceFrame } from "@/components/dashboard/WorkspaceFrame";
import { requireTradeVaultAdmin } from "@/lib/auth/session";
import {
  getAdminDashboardMetrics,
  presentAdminMetrics,
} from "@/lib/dashboard/metrics";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminSecurityPage() {
  const { user } = await requireTradeVaultAdmin();
  const metrics = await getAdminDashboardMetrics();

  const supabase = await getServerSupabaseClient();
  const [signalsRes, riskRes] = supabase
    ? await Promise.all([
        supabase
          .from("fraud_signals")
          .select("id, user_id, signal_type, severity, resolved, created_at")
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("risk_assessments")
          .select("id, user_id, score, decision, assessed_at")
          .order("assessed_at", { ascending: false })
          .limit(15),
      ])
    : [{ data: [] as Array<Record<string, unknown>> }, { data: [] as Array<Record<string, unknown>> }];

  const signals = signalsRes.data ?? [];
  const assessments = riskRes.data ?? [];

  return (
    <WorkspaceFrame
      roleLabel="Trade Vault Admin"
      heading="Security Center"
      description="Investigate fraud signals, manual-review decisions, and suspicious account behavior."
      email={user.email ?? null}
      metrics={presentAdminMetrics(metrics)}
      links={[
        { href: "/dashboard/admin", label: "Overview" },
        { href: "/dashboard/admin/users", label: "Users" },
        { href: "/dashboard/admin/loans", label: "Loans" },
      ]}
    >
      <div className="workspace-grid workspace-grid--two">
        <article className="workspace-card workspace-card--full">
          <h2 className="workspace-card-title">Recent fraud signals</h2>
          <ul className="workspace-list">
            {signals.length === 0 ? (
              <li>No fraud signals logged.</li>
            ) : (
              signals.map((signal) => (
                <li key={String(signal.id)}>
                  {String(signal.signal_type)} | severity {String(signal.severity)} | user {String(signal.user_id).slice(0, 8)} | {signal.resolved ? "resolved" : "open"}
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="workspace-card workspace-card--full">
          <h2 className="workspace-card-title">Latest risk assessments</h2>
          <ul className="workspace-list">
            {assessments.length === 0 ? (
              <li>No risk assessments logged.</li>
            ) : (
              assessments.map((assessment) => (
                <li key={String(assessment.id)}>
                  user {String(assessment.user_id).slice(0, 8)} | score {String(assessment.score)} | decision {String(assessment.decision)}
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </WorkspaceFrame>
  );
}
