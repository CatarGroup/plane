/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export type TIssueTimeLog = {
  id: string;
  issue: string;
  project: string;
  workspace: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  description: string;
  is_running: boolean;
  user: string;
  user_detail?: {
    id: string;
    display_name: string;
    avatar_url?: string | null;
  };
  created_at: string;
};

export type TTimeLogResponse = {
  results: TIssueTimeLog[];
  total_seconds: number;
  count: number;
};

export type TTimeLogPayload = {
  started_at: string;
  ended_at?: string | null;
  duration_seconds?: number;
  description?: string;
  is_running?: boolean;
};

export class IssueTimeLogService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private base(workspaceSlug: string, projectId: string, issueId: string) {
    return `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-logs`;
  }

  async list(workspaceSlug: string, projectId: string, issueId: string): Promise<TTimeLogResponse> {
    return this.get(`${this.base(workspaceSlug, projectId, issueId)}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: TTimeLogPayload
  ): Promise<TIssueTimeLog> {
    return this.post(`${this.base(workspaceSlug, projectId, issueId)}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    logId: string,
    data: Partial<TTimeLogPayload>
  ): Promise<TIssueTimeLog> {
    return this.patch(`${this.base(workspaceSlug, projectId, issueId)}/${logId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, projectId: string, issueId: string, logId: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug, projectId, issueId)}/${logId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
