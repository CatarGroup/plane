/**
 * Grupo Romboc / Catar BI — time tracker tipo Toggl.
 *
 * Circulo en el menu superior, junto al selector de Espacio de Trabajo:
 * - Parado: icono Play. Click -> busca una tarea y arranca el cronometro.
 * - Corriendo: icono Stop + tiempo transcurrido, punto rojo pulsante.
 *   Click -> para el cronometro directamente (sin confirmacion, como el
 *   icono de la barra de menu de Toggl).
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { History, Play, Square } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueSearchResponse } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { TimeTrackerTaskPickerModal } from "./task-picker-modal";
// hooks
import { useTimeTracking } from "@/hooks/store/use-time-tracking";

const pad = (n: number) => n.toString().padStart(2, "0");

const formatElapsed = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export const TimeTrackerWidget = observer(function TimeTrackerWidget() {
  const { workspaceSlug } = useParams();
  const timeTracking = useTimeTracking();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!workspaceSlug) return;
    timeTracking.fetchRunning(workspaceSlug.toString());
  }, [workspaceSlug, timeTracking]);

  if (!workspaceSlug) return null;

  const running = timeTracking.runningEntry;

  const handleSelectIssue = async (issue: TIssueSearchResponse) => {
    setIsBusy(true);
    try {
      await timeTracking.startTimer(workspaceSlug.toString(), issue.id);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "No se pudo arrancar el cronometro" });
    } finally {
      setIsBusy(false);
    }
  };

  const handleStop = async () => {
    setIsBusy(true);
    try {
      await timeTracking.stopTimer(workspaceSlug.toString());
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "No se pudo parar el cronometro" });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <TimeTrackerTaskPickerModal
        isOpen={isPickerOpen}
        handleClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectIssue}
      />
      <Tooltip
        tooltipContent={
          running ? `Corriendo: ${running.issue_detail?.name ?? "tarea"} — click para parar` : "Arrancar cronometro"
        }
        position="bottom"
      >
        <button
          type="button"
          disabled={isBusy}
          onClick={() => (running ? handleStop() : setIsPickerOpen(true))}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-full px-2.5 text-13 font-medium transition-colors disabled:opacity-60",
            running
              ? "bg-danger-subtle text-danger-primary hover:bg-danger-subtle-hover"
              : "bg-layer-transparent text-secondary hover:bg-layer-transparent-hover"
          )}
        >
          <span className="relative flex size-5 flex-shrink-0 items-center justify-center rounded-full">
            {running && (
              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-danger-primary opacity-75" />
            )}
            {running ? <Square className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
          </span>
          {running && <span className="tabular-nums">{formatElapsed(timeTracking.elapsedSeconds)}</span>}
        </button>
      </Tooltip>
      {running?.issue_detail && (
        <span className="hidden max-w-48 truncate text-11 text-tertiary md:block">{running.issue_detail.name}</span>
      )}
      <Tooltip tooltipContent="Ver tiempo de la semana" position="bottom">
        <Link
          href={`/${workspaceSlug}/time-tracking/`}
          className="flex size-8 flex-shrink-0 items-center justify-center rounded-md text-secondary hover:bg-layer-1-hover"
        >
          <History className="size-4" />
        </Link>
      </Tooltip>
    </>
  );
});
