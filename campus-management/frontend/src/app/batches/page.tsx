
import ModulePage from "../../components/ModulePage";

export default function BatchesPage() {
  return (
    <ModulePage
      title="Student Batches"
      icon="🎓"
      description="Manage academic batches and their scheduling requirements."
      features={[
        "View student batches",
        "Organize departments and semesters",
        "Set batch strength",
        "Connect batches to timetable scheduling",
      ]}
    />
  );
}
