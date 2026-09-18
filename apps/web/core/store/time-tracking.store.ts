/**
 * Grupo Romboc / Catar BI — time tracker tipo Toggl.
 */

import { action, observable, makeObservable, runInAction, computed } from "mobx";
import { TimeTrackingService } from "@/services/time-tracking";
import type { ITimeEntry } from "@/services/time-tracking";
import type { CoreRootStore } from "./root.store";

export interface ITimeTrackingStore {
  // observables
  runningEntry: ITimeEntry | null;
  entries: ITimeEntry[];
  isLoading: boolean;
  isTeamView: boolean;
  // computed
  elapsedSeconds: number;
  entriesByDay: Record<string, ITimeEntry[]>;
  totalSecondsThisWeek: number;
  // actions
  entryElapsedSeconds: (entry: ITimeEntry) => number;
  toggleTeamView: (value?: boolean) => void;
  fetchRunning: (workspaceSlug: string) => Promise<void>;
  startTimer: (workspaceSlug: string, issueId: string, description?: string) => Promise<void>;
  stopTimer: (workspaceSlug: string) => Promise<void>;
  fetchWeek: (workspaceSlug: string, weekStartISODate: string) => Promise<void>;
}

export class TimeTrackingStore implements ITimeTrackingStore {
  runningEntry: ITimeEntry | null = null;
  entries: ITimeEntry[] = [];
  isLoading = false;
  isTeamView = false;
  // "tick" es un observable que solo existe para forzar el recalculo de
  // elapsedSeconds cada segundo mientras haya un cronometro corriendo.
  private tick = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  service: TimeTrackingService;
  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      runningEntry: observable,
      entries: observable,
      isLoading: observable,
      isTeamView: observable,
      tick: observable,
      elapsedSeconds: computed,
      entriesByDay: computed,
      totalSecondsThisWeek: computed,
      toggleTeamView: action,
      fetchRunning: action,
      startTimer: action,
      stopTimer: action,
      fetchWeek: action,
    });
    this.service = new TimeTrackingService();
    this.rootStore = _rootStore;
  }

  get elapsedSeconds() {
    if (!this.runningEntry) return 0;
    return this.entryElapsedSeconds(this.runningEntry);
  }

  get entriesByDay() {
    const grouped: Record<string, ITimeEntry[]> = {};
    for (const entry of this.entries) {
      const day = entry.started_at.slice(0, 10); // YYYY-MM-DD
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(entry);
    }
    return grouped;
  }

  get totalSecondsThisWeek() {
    // en vista de equipo puede haber cronometros de OTROS usuarios
    // corriendo a la vez que el mio: cada entrada corriendo calcula su
    // propio transcurrido via entryElapsedSeconds, no reutiliza
    // this.elapsedSeconds (que es solo el mio).
    return this.entries.reduce((total, entry) => total + this.entryElapsedSeconds(entry), 0);
  }

  entryElapsedSeconds = (entry: ITimeEntry) => {
    if (!entry.is_running) return entry.duration;
    // referenciar this.tick fuerza a mobx a recomputar esto cada segundo
    // en cualquier observer que lo llame durante su render (el widget del
    // menu, el total semanal, o una fila de la lista semanal).
    void this.tick;
    const startedAt = new Date(entry.started_at).getTime();
    return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  };

  private startTicking = () => {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      runInAction(() => {
        this.tick += 1;
      });
    }, 1000);
  };

  private stopTicking = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  };

  toggleTeamView = (value?: boolean) => {
    runInAction(() => {
      this.isTeamView = value ?? !this.isTeamView;
    });
  };

  fetchRunning = async (workspaceSlug: string) => {
    try {
      const entry = await this.service.getRunning(workspaceSlug);
      runInAction(() => {
        this.runningEntry = entry;
      });
      if (entry) this.startTicking();
      else this.stopTicking();
    } catch (error) {
      console.error("Failed to fetch running time entry", error);
    }
  };

  startTimer = async (workspaceSlug: string, issueId: string, description?: string) => {
    try {
      const entry = await this.service.start(workspaceSlug, issueId, description);
      runInAction(() => {
        this.runningEntry = entry;
      });
      this.startTicking();
    } catch (error) {
      console.error("Failed to start time entry", error);
      throw error;
    }
  };

  stopTimer = async (workspaceSlug: string) => {
    if (!this.runningEntry) return;
    const entryId = this.runningEntry.id;
    try {
      const entry = await this.service.stop(workspaceSlug, entryId);
      runInAction(() => {
        this.runningEntry = null;
        this.entries = [entry, ...this.entries.filter((e) => e.id !== entry.id)];
      });
      this.stopTicking();
    } catch (error) {
      console.error("Failed to stop time entry", error);
      throw error;
    }
  };

  fetchWeek = async (workspaceSlug: string, weekStartISODate: string) => {
    runInAction(() => {
      this.isLoading = true;
    });
    try {
      const entries = await this.service.list(workspaceSlug, {
        team: this.isTeamView,
        week_start: weekStartISODate,
      });
      runInAction(() => {
        this.entries = entries;
      });
      // en vista de equipo puede haber cronometros de otros corriendo
      // aunque el mio (this.runningEntry) este parado: igual hace falta
      // el intervalo para que esas filas tiqueen en vivo.
      if (entries.some((entry) => entry.is_running)) this.startTicking();
    } catch (error) {
      console.error("Failed to fetch week time entries", error);
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };
}
