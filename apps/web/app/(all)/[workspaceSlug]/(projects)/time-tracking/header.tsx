/**
 * Grupo Romboc / Catar BI — time tracker tipo Toggl.
 */

import { observer } from "mobx-react";
import { Clock } from "lucide-react";
import { Breadcrumbs, Header } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useTimeTracking } from "@/hooks/store/use-time-tracking";

export const WorkspaceTimeTrackingHeader = observer(function WorkspaceTimeTrackingHeader() {
  const timeTracking = useTimeTracking();

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2.5">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={<BreadcrumbLink label="Tiempo" icon={<Clock className="size-4 text-secondary" />} />}
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <div className="flex items-center rounded-md border-[0.5px] border-strong p-0.5 text-13">
          <button
            type="button"
            onClick={() => timeTracking.toggleTeamView(false)}
            className={cn(
              "rounded-sm px-2.5 py-1",
              !timeTracking.isTeamView ? "bg-layer-2 text-primary" : "text-secondary"
            )}
          >
            Mío
          </button>
          <button
            type="button"
            onClick={() => timeTracking.toggleTeamView(true)}
            className={cn(
              "rounded-sm px-2.5 py-1",
              timeTracking.isTeamView ? "bg-layer-2 text-primary" : "text-secondary"
            )}
          >
            Equipo
          </button>
        </div>
      </Header.RightItem>
    </Header>
  );
});
