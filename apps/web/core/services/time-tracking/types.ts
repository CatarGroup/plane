/**
 * Grupo Romboc / Catar BI — time tracker tipo Toggl.
 */

export interface ITimeEntryIssueLite {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
}

export interface ITimeEntryUserLite {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface ITimeEntry {
  id: string;
  issue: string;
  issue_detail: ITimeEntryIssueLite | null;
  project: string;
  workspace: string;
  user: string;
  user_detail: ITimeEntryUserLite;
  description: string;
  started_at: string;
  ended_at: string | null;
  duration: number;
  is_running: boolean;
  created_at: string;
  updated_at: string;
}
