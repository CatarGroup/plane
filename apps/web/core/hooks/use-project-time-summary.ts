/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * CatarGroup: totales de tiempo por tarea de un proyecto.
 * Una sola peticion por proyecto (promesa compartida) y cache en memoria.
 */

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

class TimeSummaryService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getProjectSummary(workspaceSlug: string, projectId: string): Promise<Record<string, number>> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/time-logs/summary/`)
      .then((r) => r?.data?.totales ?? {})
      .catch(() => ({}));
  }
}

const service = new TimeSummaryService();

// cache: projectId -> { issueId: segundos }
const cache = new Map<string, Record<string, number>>();
// peticiones en vuelo: projectId -> promesa
const enVuelo = new Map<string, Promise<Record<string, number>>>();

export const cargarTotalesProyecto = (workspaceSlug: string, projectId: string) => {
  if (cache.has(projectId)) return Promise.resolve(cache.get(projectId)!);
  if (enVuelo.has(projectId)) return enVuelo.get(projectId)!;
  const p = service
    .getProjectSummary(workspaceSlug, projectId)
    .then((data) => {
      cache.set(projectId, data);
      enVuelo.delete(projectId);
      return data;
    })
    .catch(() => {
      enVuelo.delete(projectId);
      return {};
    });
  enVuelo.set(projectId, p);
  return p;
};

/** Invalida la cache (tras crear/borrar un tramo). */
export const invalidarTotales = (projectId?: string) => {
  if (projectId) cache.delete(projectId);
  else cache.clear();
};

export const useProjectTimeSummary = (workspaceSlug?: string, projectId?: string) => {
  const [totales, setTotales] = useState<Record<string, number>>(
    projectId ? (cache.get(projectId) ?? {}) : {}
  );

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;
    let vivo = true;
    cargarTotalesProyecto(workspaceSlug, projectId).then((data) => {
      if (vivo) setTotales(data);
    });
    return () => {
      vivo = false;
    };
  }, [workspaceSlug, projectId]);

  return totales;
};

/** 3600 -> "1 h", 5400 -> "1 h 30 min", 0 -> "" */
export const formatearTiempo = (segundos?: number): string => {
  if (!segundos) return "";
  const minutos = Math.round(segundos / 60);
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
};
