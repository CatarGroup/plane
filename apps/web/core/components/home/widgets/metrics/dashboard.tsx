/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * CatarGroup: cuadro de mando del Inicio.
 * Totales del espacio y desglose por departamento (cada proyecto).
 */

import { useMemo } from "react";
import useSWR from "swr";
// plane imports
import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

type TDepartamento = {
  id: string;
  nombre: string;
  identificador: string;
  tareas: number;
  hechas: number;
  abiertas: number;
  vencidas: number;
  segundos: number;
  porcentaje: number;
  completado: boolean;
};

type TRespuesta = {
  proyectos: TDepartamento[];
  totales: {
    proyectos: number;
    proyectos_completados: number;
    porcentaje_proyectos: number;
    tareas: number;
    hechas: number;
    abiertas: number;
    vencidas: number;
    porcentaje_tareas: number;
    segundos: number;
  };
};

class MetricsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getMetrics(workspaceSlug: string): Promise<TRespuesta> {
    return this.get(`/api/workspaces/${workspaceSlug}/home-metrics/`)
      .then((r) => r?.data)
      .catch(() => null);
  }
}

const servicio = new MetricsService();

const horas = (segundos: number) => {
  if (!segundos) return "0 h";
  const minutos = Math.round(segundos / 60);
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
};

const Tarjeta = ({
  etiqueta,
  valor,
  detalle,
  acento,
}: {
  etiqueta: string;
  valor: string;
  detalle: string;
  acento?: string;
}) => (
  <div className="rounded-lg border border-subtle bg-surface-1 px-4 py-3">
    <p className="text-xs font-medium text-tertiary">{etiqueta}</p>
    <p className={`mt-1 text-2xl font-semibold ${acento ?? "text-primary"}`}>{valor}</p>
    <p className="mt-0.5 text-xs text-tertiary">{detalle}</p>
  </div>
);

const Barra = ({ porcentaje }: { porcentaje: number }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-layer-2">
    <div
      className="h-full rounded-full bg-accent-primary transition-all"
      style={{ width: `${Math.min(100, Math.max(0, porcentaje))}%` }}
    />
  </div>
);

export const HomeMetricsDashboard = ({ workspaceSlug }: { workspaceSlug: string }) => {
  const { data, isLoading } = useSWR<TRespuesta>(
    workspaceSlug ? `HOME_METRICS_${workspaceSlug}` : null,
    () => servicio.getMetrics(workspaceSlug),
    { revalidateOnFocus: false, revalidateOnReconnect: true }
  );

  const departamentos = useMemo(
    () => [...(data?.proyectos ?? [])].sort((a, b) => b.tareas - a.tareas),
    [data]
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[86px] animate-pulse rounded-lg border border-subtle bg-surface-1" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const t = data.totales;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-14 font-medium text-primary">Resumen del espacio</h3>
        <span className="text-xs text-tertiary">
          {t.proyectos} departamento{t.proyectos === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tarjeta
          etiqueta="Proyectos completados"
          valor={`${t.porcentaje_proyectos}%`}
          detalle={`${t.proyectos_completados} de ${t.proyectos}`}
          acento="text-accent-primary"
        />
        <Tarjeta
          etiqueta="Tareas completadas"
          valor={`${t.porcentaje_tareas}%`}
          detalle={`${t.hechas} de ${t.tareas}`}
          acento="text-accent-primary"
        />
        <Tarjeta etiqueta="Tiempo invertido" valor={horas(t.segundos)} detalle="en todo el espacio" />
        <Tarjeta
          etiqueta="Tareas vencidas"
          valor={String(t.vencidas)}
          detalle={t.abiertas ? `${t.abiertas} abiertas en total` : "sin tareas abiertas"}
          acento={t.vencidas ? "text-danger-primary" : undefined}
        />
      </div>

      {departamentos.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-subtle">
          <div className="grid grid-cols-12 gap-2 border-b border-subtle bg-layer-1 px-4 py-2 text-11 font-medium tracking-wide text-tertiary uppercase">
            <span className="col-span-4">Departamento</span>
            <span className="col-span-4">Avance</span>
            <span className="col-span-2 text-right">Tareas</span>
            <span className="col-span-2 text-right">Tiempo</span>
          </div>
          {departamentos.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-12 items-center gap-2 border-b border-subtle px-4 py-2.5 last:border-0 hover:bg-layer-1"
            >
              <div className="col-span-4 flex min-w-0 items-center gap-2">
                <span className="truncate text-13 text-primary">{d.nombre}</span>
                {d.vencidas > 0 && (
                  <span className="shrink-0 rounded bg-danger-subtle px-1.5 py-0.5 text-10 font-medium text-danger-primary">
                    {d.vencidas} vencida{d.vencidas === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <div className="col-span-4 flex items-center gap-2">
                <Barra porcentaje={d.porcentaje} />
                <span className="w-9 shrink-0 text-right text-11 tabular-nums text-secondary">{d.porcentaje}%</span>
              </div>
              <span className="col-span-2 text-right text-12 tabular-nums text-secondary">
                {d.hechas}/{d.tareas}
              </span>
              <span className="col-span-2 text-right text-12 tabular-nums text-secondary">{horas(d.segundos)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
