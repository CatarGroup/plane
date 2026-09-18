/**
 * Grupo Romboc / Catar BI — time tracker tipo Toggl.
 *
 * Vista semanal: entradas agrupadas por dia, con navegacion semana
 * anterior/siguiente y total por dia y por semana. No es el calendario
 * con bloques absolutos de Toggl (eso queda para una siguiente pasada
 * visual) — de momento es una lista agrupada, funcional.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useTimeTracking } from "@/hooks/store/use-time-tracking";
import type { ITimeEntry } from "@/services/time-tracking";

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const getMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

const formatDuration = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0 && m === 0) return "0m";
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const TimeTrackingWeeklyView = observer(function TimeTrackingWeeklyView() {
  const { workspaceSlug } = useParams();
  const timeTracking = useTimeTracking();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  useEffect(() => {
    if (!workspaceSlug) return;
    timeTracking.fetchWeek(workspaceSlug.toString(), toISODate(weekStart));
  }, [workspaceSlug, weekStart, timeTracking, timeTracking.isTeamView]);

  if (!workspaceSlug) return null;

  const goToWeek = (deltaWeeks: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + deltaWeeks * 7);
    setWeekStart(next);
  };

  const weekEnd = weekDays[6];
  const weekLabel = `${weekStart.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString(
    "es-ES",
    { day: "numeric", month: "short" }
  )}`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-subtle px-page-x py-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => goToWeek(-1)} className="rounded-sm p-1 hover:bg-layer-1">
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-14 font-medium text-primary">{weekLabel}</span>
          <button type="button" onClick={() => goToWeek(1)} className="rounded-sm p-1 hover:bg-layer-1">
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(getMonday(new Date()))}
            className="ml-2 rounded-sm bg-layer-transparent px-2.5 py-1 text-11 font-medium text-secondary hover:bg-layer-transparent-hover"
          >
            Esta semana
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-13 text-secondary">
          <Clock className="size-4" />
          <span className="font-medium text-primary">{formatDuration(timeTracking.totalSecondsThisWeek)}</span>
          <span>esta semana</span>
        </div>
      </div>

      <div className="vertical-scrollbar scrollbar-lg flex-1 overflow-y-auto px-page-x py-page-y">
        {timeTracking.isLoading ? (
          <Loader className="space-y-3">
            <Loader.Item height="60px" />
            <Loader.Item height="60px" />
            <Loader.Item height="60px" />
          </Loader>
        ) : (
          <div className="flex flex-col gap-4">
            {weekDays.map((day) => {
              const iso = toISODate(day);
              const dayEntries = timeTracking.entriesByDay[iso] ?? [];
              const dayTotal = dayEntries.reduce((total, entry) => total + timeTracking.entryElapsedSeconds(entry), 0);
              const isToday = iso === toISODate(new Date());

              return (
                <div key={iso} className="rounded-md border-[0.5px] border-subtle">
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-t-md px-3 py-2",
                      isToday ? "bg-accent-subtle" : "bg-layer-1"
                    )}
                  >
                    <span className="text-13 font-medium text-primary">
                      {DAY_NAMES[day.getDay() === 0 ? 6 : day.getDay() - 1]}{" "}
                      <span className="text-tertiary">{day.getDate()}</span>
                    </span>
                    <span className="text-13 text-secondary">{formatDuration(dayTotal)}</span>
                  </div>
                  {dayEntries.length === 0 ? (
                    <p className="px-3 py-3 text-13 text-tertiary">Sin entradas</p>
                  ) : (
                    <div className="divide-y divide-subtle">
                      {dayEntries.map((entry) => (
                        <TimeEntryRow key={entry.id} entry={entry} showUser={timeTracking.isTeamView} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

const TimeEntryRow = observer(function TimeEntryRow({ entry, showUser }: { entry: ITimeEntry; showUser: boolean }) {
  const timeTracking = useTimeTracking();
  const seconds = timeTracking.entryElapsedSeconds(entry);

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-13 font-medium text-primary">
          {entry.issue_detail?.name ?? "Tarea eliminada"}
        </span>
        <div className="flex items-center gap-1.5 text-11 text-tertiary">
          {showUser && <span>{entry.user_detail.display_name}</span>}
          {entry.description && <span className="truncate">{entry.description}</span>}
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        {entry.is_running && <span className="size-1.5 animate-pulse rounded-full bg-danger-primary" />}
        <span
          className={cn(
            "text-13 tabular-nums",
            entry.is_running ? "font-medium text-danger-primary" : "text-secondary"
          )}
        >
          {formatDuration(seconds)}
        </span>
      </div>
    </div>
  );
});
