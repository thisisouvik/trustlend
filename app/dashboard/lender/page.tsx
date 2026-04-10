import { RoleDashboardScreen } from "@/components/dashboard/RoleDashboardScreen";

export default function LenderDashboardPage() {
  return (
    <RoleDashboardScreen
      expectedRole="lender"
      heading="Lender workspace"
      description="Monitor deployed capital, pool yield, and borrower quality signals in one clean view."
      metrics={[
        { label: "Capital deployed", value: "$18,200" },
        { label: "Current APY", value: "12.4%" },
        { label: "Portfolio default", value: "3.1%" },
      ]}
      primaryHref="#"
      primaryLabel="Deposit to pool"
      secondaryHref="#"
      secondaryLabel="Review borrower signals"
    />
  );
}
