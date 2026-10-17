
import ModulePage from "../../components/ModulePage";

export default function ResourcesPage() {
  return (
    <ModulePage
      title="Resource Management"
      icon="📊"
      description="Monitor and organize academic resources."
      features={[
        "Track room availability",
        "Manage laboratory resources",
        "Review resource utilization",
        "Support resource allocation decisions",
      ]}
    />
  );
}
