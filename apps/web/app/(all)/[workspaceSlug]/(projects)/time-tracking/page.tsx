/**
 * Grupo Romboc / Catar BI — time tracker tipo Toggl.
 */

// components
import { PageHead } from "@/components/core/page-title";
import { TimeTrackingWeeklyView } from "@/components/time-tracking/weekly-view";

export default function WorkspaceTimeTrackingPage() {
  return (
    <>
      <PageHead title="Tiempo" />
      <div className="relative h-full w-full overflow-hidden">
        <TimeTrackingWeeklyView />
      </div>
    </>
  );
}
