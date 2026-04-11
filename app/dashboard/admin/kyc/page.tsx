import { getPendingKYCDocuments } from "@/app/actions/admin-kyc";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { WorkspaceFrame } from "@/components/dashboard/WorkspaceFrame";
import {
  getAdminDashboardMetrics,
  presentAdminMetrics,
} from "@/lib/dashboard/metrics";
import AdminKYCClient from "./kyc-client";

export default async function AdminKYCPage() {
  const { user } = await requireAuthenticatedUser("admin");

  const supabase = await getServerSupabaseClient();
  const { data: adminProfile } = supabase
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  if (adminProfile?.role !== "admin") {
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        <h1>Access Denied</h1>
        <p>You do not have admin privileges.</p>
      </div>
    );
  }

  const metrics = await getAdminDashboardMetrics();
  const pendingDocs = await getPendingKYCDocuments();

  return (
    <WorkspaceFrame
      roleLabel="Admin Dashboard"
      heading="KYC Verification Center"
      description="Review and verify identity documents for lender/borrower KYC compliance."
      email={user.email ?? null}
      userName={String(user.user_metadata?.full_name ?? "Admin")}
      metrics={presentAdminMetrics(metrics)}
      currentPath="/dashboard/admin/kyc"
      links={[
        { href: "/dashboard/admin", label: "Dashboard" },
        { href: "/dashboard/admin/users", label: "Users" },
        { href: "/dashboard/admin/loans", label: "Loans" },
        { href: "/dashboard/admin/kyc", label: "KYC Verification" },
        { href: "/dashboard/admin/security", label: "Security" },
      ]}
    >
      <AdminKYCClient documents={pendingDocs || []} />
    </WorkspaceFrame>
  );
}
