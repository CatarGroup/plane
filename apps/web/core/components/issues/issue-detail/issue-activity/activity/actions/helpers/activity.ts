/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssueActivity } from "@plane/types";

export const getRelationActivityContent = (activity: TIssueActivity | undefined): string | undefined => {
  if (!activity) return;

  switch (activity.field) {
    case "blocking":
      return activity.old_value === ""
        ? `marcó esta tarea como bloqueante de la tarea `
        : `quitó el bloqueo sobre la tarea `;
    case "blocked_by":
      return activity.old_value === ""
        ? `marcó esta tarea como bloqueada por `
        : `quitó el bloqueo de la tarea `;
    case "duplicate":
      return activity.old_value === ""
        ? `marcó esta tarea como duplicada de `
        : `quitó la marca de duplicado de `;
    case "relates_to":
      return activity.old_value === "" ? `marcó que esta tarea está relacionada con ` : `quitó la relación con `;
  }

  return;
};
