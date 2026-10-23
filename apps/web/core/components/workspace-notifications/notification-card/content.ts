/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { replaceUnderscoreIfSnakeCase } from "@plane/utils";
import type { TNotificationContentMap } from "@/components/workspace-notifications/sidebar/notification-card/content";

// Additional notification content map for CE (empty - EE extends this)
export const ADDITIONAL_NOTIFICATION_CONTENT_MAP: TNotificationContentMap = {};

// Fallback action renderer for fields not in the map
const VERBOS_ES: Record<string, string> = {
  updated: "actualizó",
  created: "creó",
  deleted: "eliminó",
};

const CAMPOS_ES: Record<string, string> = {
  state: "el estado",
  priority: "la prioridad",
  module: "el módulo",
  modules: "el módulo",
  cycle: "el ciclo",
  cycles: "el ciclo",
  assignees: "los asignados",
  labels: "las etiquetas",
  parent: "la tarea padre",
  estimate_point: "la estimación",
  start_date: "la fecha de inicio",
  target_date: "la fecha de vencimiento",
  description: "la descripción",
  name: "el nombre",
  link: "el enlace",
  attachment: "el adjunto",
};

export const renderAdditionalAction = (notificationField: string, verb: string | undefined) => {
  const baseAction = !["comment", "archived_at"].includes(notificationField) ? VERBOS_ES[verb ?? ""] ?? verb : "";
  const campo = CAMPOS_ES[notificationField] ?? replaceUnderscoreIfSnakeCase(notificationField);
  return `${baseAction} ${campo}`;
};

// Fallback value renderer for fields not in the map
export const renderAdditionalValue = (
  _notificationField: string | undefined,
  newValue: string | undefined,
  _oldValue: string | undefined
) => newValue;

export const shouldShowConnector = (notificationField: string | undefined) =>
  !["comment", "archived_at", "None", "assignees", "labels", "start_date", "target_date", "parent"].includes(
    notificationField || ""
  );

export const shouldRender = (notificationField: string | undefined, verb: string | undefined) => verb !== "deleted";
