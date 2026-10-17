
import ModulePage from "../../components/ModulePage";

export default function TimetablePage() {
  return (
    <ModulePage
      title="Timetable Scheduling"
      icon="📅"
      description="Plan academic schedules while respecting campus constraints."
      features={[
        "Assign faculty to subjects",
        "Allocate rooms and time slots",
        "Identify scheduling conflicts",
        "Support dynamic rescheduling",
      ]}
    />
  );
}
