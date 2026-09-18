/**
 * Grupo Romboc / Catar BI — time tracker tipo Toggl.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";
import type { ITimeEntry } from "./types";

export class TimeTrackingService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async start(workspaceSlug: string, issueId: string, description?: string): Promise<ITimeEntry> {
    return this.post(`/api/workspaces/${workspaceSlug}/time-entries/start/`, {
      issue_id: issueId,
      description: description ?? "",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async stop(workspaceSlug: string, entryId: string): Promise<ITimeEntry> {
    return this.post(`/api/workspaces/${workspaceSlug}/time-entries/${entryId}/stop/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getRunning(workspaceSlug: string): Promise<ITimeEntry | null> {
    return this.get(`/api/workspaces/${workspaceSlug}/time-entries/running/`)
      .then((response) => response?.data ?? null)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async list(workspaceSlug: string, params: { team?: boolean; week_start?: string } = {}): Promise<ITimeEntry[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/time-entries/`, {
      params: {
        ...(params.team ? { team: "true" } : {}),
        ...(params.week_start ? { week_start: params.week_start } : {}),
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, entryId: string, data: Partial<ITimeEntry>): Promise<ITimeEntry> {
    return this.patch(`/api/workspaces/${workspaceSlug}/time-entries/${entryId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async remove(workspaceSlug: string, entryId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/time-entries/${entryId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
