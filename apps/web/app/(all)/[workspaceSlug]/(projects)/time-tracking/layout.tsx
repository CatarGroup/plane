/**
 * Grupo Romboc / Catar BI — time tracker tipo Toggl.
 */

import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { WorkspaceTimeTrackingHeader } from "./header";

export default function WorkspaceTimeTrackingLayout() {
  return (
    <>
      <AppHeader header={<WorkspaceTimeTrackingHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
