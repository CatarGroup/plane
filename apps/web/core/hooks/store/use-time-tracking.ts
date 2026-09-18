/**
 * Grupo Romboc / Catar BI — time tracker tipo Toggl.
 */

import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { ITimeTrackingStore } from "@/store/time-tracking.store";

export const useTimeTracking = (): ITimeTrackingStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTimeTracking must be used within StoreProvider");
  return context.timeTracking;
};
