"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { getDashboardPath, normalizeUserRole } from "@/lib/auth/roles";

export default function DashboardEntryPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const routeToRoleDashboard = async () => {
      const supabase = getBrowserSupabaseClient();
      if (!supabase) {
        if (!cancelled) {
          router.replace("/");
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        if (!cancelled) {
          router.replace("/");
        }
        return;
      }

      const role = normalizeUserRole(session.user.user_metadata?.account_type);
      if (!cancelled) {
        router.replace(getDashboardPath(role));
      }
    };

    void routeToRoleDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="role-dashboard-shell">
      <p className="role-loading">Routing to your dashboard...</p>
    </main>
  );
}
