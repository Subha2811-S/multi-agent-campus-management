
import ModulePage from "../../components/ModulePage";

export default function ReportsPage() {
  return (
    <ModulePage
      title="Campus Reports"
      icon="📊"
      description="Review campus scheduling and resource information."
      features={[
        "Faculty workload overview",
        "Room utilization report",
        "Timetable conflict summary",
        "Scheduling performance report",
      ]}
    />
  );
}
