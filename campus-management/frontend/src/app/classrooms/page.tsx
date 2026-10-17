import ModulePage from "../../components/ModulePage";

export default function ClassroomsPage() {
  return (
    <ModulePage
      title="Classrooms & Labs"
      icon="🏢"
      description="Manage classrooms, laboratories, room capacity, and availability."
      features={[
        "View classrooms and laboratories",
        "Record room capacity and equipment",
        "Track room availability",
        "Prepare room data for timetable allocation",
      ]}
    />
  );
}
