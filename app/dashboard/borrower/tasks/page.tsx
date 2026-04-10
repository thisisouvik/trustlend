import { WorkspaceFrame } from "@/components/dashboard/WorkspaceFrame";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  getBorrowerDashboardMetrics,
  presentBorrowerMetrics,
} from "@/lib/dashboard/metrics";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function BorrowerTasksPage() {
  const { user } = await requireAuthenticatedUser("borrower");
  const metrics = await getBorrowerDashboardMetrics(user.id);

  const supabase = await getServerSupabaseClient();
  const { data: tasks } = supabase
    ? await supabase
        .from("tasks")
        .select("id, title, status, reward_xlm, difficulty")
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false })
        .limit(8)
    : { data: [] as Array<Record<string, unknown>> };

  return (
    <WorkspaceFrame
      roleLabel="Borrower Dashboard"
      heading="Tasks Workspace"
      description="Track active assignments and completed tasks used to build trust reputation."
      email={user.email ?? null}
      metrics={presentBorrowerMetrics(metrics)}
      links={[
        { href: "/dashboard/borrower", label: "Overview" },
        { href: "/dashboard/borrower/loans", label: "My loans" },
        { href: "/dashboard/borrower/profile", label: "Profile" },
      ]}
    >
      <div className="workspace-grid">
        {(tasks ?? []).length === 0 ? (
          <article className="workspace-card workspace-card--full">
            <h2 className="workspace-card-title">No assigned tasks yet</h2>
            <p className="workspace-card-copy">
              Task records will appear here once the tasks marketplace is connected to your account.
            </p>
          </article>
        ) : (
          (tasks ?? []).map((task) => (
            <article key={String(task.id)} className="workspace-card">
              <h2 className="workspace-card-title">{String(task.title ?? "Untitled task")}</h2>
              <p className="workspace-card-copy">
                Status: {String(task.status)} | Reward: {Number(task.reward_xlm ?? 0).toFixed(2)} XLM | Difficulty: {String(task.difficulty)}
              </p>
            </article>
          ))
        )}
      </div>
    </WorkspaceFrame>
  );
}
