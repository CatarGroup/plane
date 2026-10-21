/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * CatarGroup: "T. Invertido: 3 h" en tarjetas y filas de lista.
 */

import { Clock } from "lucide-react";
import { cn } from "@plane/utils";
import { formatearTiempo, useProjectTimeSummary } from "@/hooks/use-project-time-summary";

interface Props {
  workspaceSlug?: string;
  projectId?: string;
  issueId: string;
  className?: string;
  /** "short" -> solo el tiempo (para el listado) */
  variant?: "short" | "full";
}

export function IssueTimeBadge({ workspaceSlug, projectId, issueId, className, variant = "full" }: Props) {
  const totales = useProjectTimeSummary(workspaceSlug, projectId);
  const texto = formatearTiempo(totales[issueId]);
  if (!texto) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-subtle px-1.5 py-0.5 text-body-xs-regular text-secondary",
        className
      )}
      title={`Tiempo invertido: ${texto}`}
    >
      <Clock className="size-3 shrink-0" />
      {variant === "full" ? <span>T. Invertido: {texto}</span> : <span className="tabular-nums">{texto}</span>}
    </span>
  );
}
