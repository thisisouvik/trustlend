import { WorkspaceFrame } from "@/components/dashboard/WorkspaceFrame";
import { ProfileSettingsForm } from "@/components/dashboard/ProfileSettingsForm";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  getLenderDashboardMetrics,
  presentLenderMetrics,
} from "@/lib/dashboard/metrics";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function LenderProfilePage() {
  const { user } = await requireAuthenticatedUser("lender");
  const metrics = await getLenderDashboardMetrics(user.id);

  const supabase = await getServerSupabaseClient();
  const { data: profile } = supabase
    ? await supabase
        .from("profiles")
        .select("full_name, phone, role, country_code, kyc_status, risk_status")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null as Record<string, unknown> | null };

  return (
    <WorkspaceFrame
      roleLabel="Lender Dashboard"
      heading="Profile Settings & Security"
      description="Update your personal details and complete required compliance checks to manage lending pools."
      email={user.email ?? null}
      metrics={presentLenderMetrics(metrics)}
      currentPath="/dashboard/lender/profile"
      links={[
        { href: "/dashboard/lender", label: "Home" },
        { href: "/dashboard/lender/pools", label: "Pools" },
        { href: "/dashboard/lender/portfolio", label: "Portfolio" },
        { href: "/dashboard/lender/risk", label: "Risk" },
        { href: "/dashboard/lender/profile", label: "Settings" },
      ]}
    >
      <div className="workspace-grid workspace-grid--two">
        <article className="workspace-card">
          <h2 className="workspace-card-title">Identity Verification</h2>
          <p className="workspace-card-copy">
            Please provide accurate details to generate an on-chain zero-knowledge compliance certificate for lenders.
          </p>
          <ProfileSettingsForm 
            initialName={String(profile?.full_name ?? "")}
            initialPhone={String(profile?.phone ?? "")}
            initialCountry={String(profile?.country_code ?? "")}
          />
        </article>

        <div className="workspace-stack">
          <article className="workspace-card">
            <h2 className="workspace-card-title">Compliance State</h2>
            <div className="workspace-mini-metrics" style={{ marginTop: '1rem', gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div>
                <span className="wallet-balance-label">KYC Status</span>
                <p style={{ marginTop: '0.2rem', fontWeight: 600 }}>{String(profile?.kyc_status ?? "pending").toUpperCase()}</p>
              </div>
              <div>
                <span className="wallet-balance-label">Risk Profile</span>
                <p style={{ marginTop: '0.2rem', fontWeight: 600 }}>{String(profile?.risk_status ?? "low").toUpperCase()}</p>
              </div>
            </div>
            <p className="workspace-card-copy" style={{ marginTop: '1rem' }}>
              Your profile data unlocks higher deposit limits and verified status in decentralized lending operations.
            </p>
          </article>

          <article className="workspace-card">
            <h2 className="workspace-card-title">Account Security</h2>
            <ul className="workspace-list workspace-list--compact">
              <li>
                <span>Email Address</span>
                <strong>{user.email ?? "Unknown"}</strong>
              </li>
              <li>
                <span>Role</span>
                <strong>{String(profile?.role ?? "lender")}</strong>
              </li>
              <li>
                <span>Two-Factor Auth</span>
                <span className="wallet-status-indicator wallet-status-active"></span>
              </li>
            </ul>
            <div className="workspace-inline-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="workspace-nav-link">Change Password</button>
            </div>
          </article>
        </div>
      </div>
    </WorkspaceFrame>
  );
}
