/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * CatarGroup: cuadro de mando del Inicio.
 * Izquierda: resumen del espacio con reparto por estado.
 * Derecha: departamentos (cada proyecto) con avance, tareas y tiempo.
 * Al pulsar un departamento se despliegan sus tareas con enlace a cada una.
 */

import { useMemo, useState } from "react";
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

type TTarea = {
  id: string;
  nombre: string;
  secuencia: number;
  identificador: string;
  estado: string;
  grupo: string;
  vencida: boolean;
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

  async getTareas(workspaceSlug: string, projectId: string): Promise<TTarea[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/home-metrics/?project=${projectId}`)
      .then((r) => r?.data?.tareas ?? [])
      .catch(() => []);
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

const COLORES: Record<string, string> = {
  completed: "#22c55e",
  started: "#f59e0b",
  unstarted: "#6366f1",
  backlog: "#94a3b8",
  cancelled: "#ef4444",
};

const ETIQUETAS: Record<string, string> = {
  completed: "Completadas",
  started: "En curso",
  unstarted: "Sin empezar",
  backlog: "Pendientes",
  cancelled: "Canceladas",
};

/** Tarta (donut) en SVG puro, sin librerias. */
const Tarta = ({ datos, total }: { datos: { clave: string; valor: number }[]; total: number }) => {
  const R = 52;
  const grosor = 18;
  const C = 2 * Math.PI * R;
  let acumulado = 0;

  return (
    <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0">
      <circle cx="70" cy="70" r={R} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={grosor} />
      {datos
        .filter((d) => d.valor > 0)
        .map((d) => {
          const largo = total ? (d.valor / total) * C : 0;
          const el = (
            <circle
              key={d.clave}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={COLORES[d.clave] ?? "#94a3b8"}
              strokeWidth={grosor}
              strokeDasharray={`${largo} ${C - largo}`}
              strokeDashoffset={-acumulado}
              transform="rotate(-90 70 70)"
            />
          );
          acumulado += largo;
          return el;
        })}
      <text x="70" y="68" textAnchor="middle" className="fill-current text-[22px] font-semibold">
        {total}
      </text>
      <text x="70" y="86" textAnchor="middle" className="fill-current text-[10px] opacity-60">
        tareas
      </text>
    </svg>
  );
};

const KPI = ({
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
    <p className={`text-2xl mt-1 font-semibold ${acento ?? "text-primary"}`}>{valor}</p>
    <p className="text-xs mt-0.5 text-tertiary">{detalle}</p>
  </div>
);

const FilaDepartamento = ({
  d,
  workspaceSlug,
  abierto,
  onToggle,
}: {
  d: TDepartamento;
  workspaceSlug: string;
  abierto: boolean;
  onToggle: () => void;
}) => {
  const { data: tareas, isLoading } = useSWR(
    abierto ? `HOME_METRICS_TASKS_${d.id}` : null,
    () => servicio.getTareas(workspaceSlug, d.id),
    { revalidateOnFocus: false }
  );

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-12 items-center gap-2 border-b border-subtle px-4 py-2.5 text-left transition-colors hover:bg-layer-1"
      >
        <span className="col-span-4 flex min-w-0 items-center gap-1.5">
          <span className={`shrink-0 text-[9px] transition-transform ${abierto ? "rotate-90" : ""}`}>▶</span>
          <span className="truncate text-13 text-primary">{d.nombre}</span>
          {d.vencidas > 0 && (
            <span className="shrink-0 rounded bg-danger-subtle px-1.5 py-0.5 text-10 font-medium text-danger-primary">
              {d.vencidas}
            </span>
          )}
        </span>
        <span className="col-span-4 flex items-center gap-2">
          <span className="h-1.5 w-full overflow-hidden rounded-full bg-layer-2">
            <span
              className="block h-full rounded-full bg-accent-primary"
              style={{ width: `${Math.min(100, Math.max(0, d.porcentaje))}%` }}
            />
          </span>
          <span className="w-9 shrink-0 text-right text-11 text-secondary tabular-nums">{d.porcentaje}%</span>
        </span>
        <span className="col-span-2 text-right text-12 text-secondary tabular-nums">
          {d.hechas}/{d.tareas}
        </span>
        <span className="col-span-2 text-right text-12 text-secondary tabular-nums">{horas(d.segundos)}</span>
      </button>

      {abierto && (
        <div className="border-b border-subtle bg-layer-1 px-4 py-2">
          {isLoading && <p className="py-1 text-11 text-tertiary">Cargando tareas…</p>}
          {!isLoading && (!tareas || tareas.length === 0) && (
            <p className="py-1 text-11 text-tertiary">Este departamento no tiene tareas.</p>
          )}
          <div className="flex max-h-64 flex-col overflow-y-auto">
            {tareas?.map((t) => (
              <a
                key={t.id}
                href={`/${workspaceSlug}/projects/${d.id}/issues/${t.id}`}
                className="flex items-center gap-2 rounded px-1 py-1 text-12 text-secondary hover:bg-surface-1 hover:text-primary"
              >
                <span className="w-16 shrink-0 text-11 tabular-nums opacity-70">
                  {t.identificador}-{t.secuencia}
                </span>
                <span className="min-w-0 flex-1 truncate">{t.nombre}</span>
                {t.vencida && <span className="shrink-0 text-10 font-medium text-danger-primary">vencida</span>}
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-10"
                  style={{
                    backgroundColor: `${COLORES[t.grupo] ?? "#94a3b8"}22`,
                    color: COLORES[t.grupo] ?? "#94a3b8",
                  }}
                >
                  {ETIQUETAS[t.grupo] ?? t.estado}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export const HomeMetricsDashboard = ({ workspaceSlug }: { workspaceSlug: string }) => {
  const [abierto, setAbierto] = useState<string | null>(null);
  const { data, isLoading } = useSWR<TRespuesta>(
    workspaceSlug ? `HOME_METRICS_${workspaceSlug}` : null,
    () => servicio.getMetrics(workspaceSlug),
    { revalidateOnFocus: false, revalidateOnReconnect: true }
  );

  const departamentos = useMemo(() => [...(data?.proyectos ?? [])].sort((a, b) => b.tareas - a.tareas), [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-lg border border-subtle bg-surface-1" />
        <div className="h-64 animate-pulse rounded-lg border border-subtle bg-surface-1" />
      </div>
    );
  }

  if (!data) return null;

  const t = data.totales;
  const reparto = [
    { clave: "completed", valor: t.hechas },
    { clave: "unstarted", valor: t.abiertas },
  ];

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
      {/* Izquierda: resumen */}
      <div className="flex flex-col gap-3">
        <h3 className="text-14 font-medium text-primary">Resumen</h3>

        <div className="flex items-center gap-5 rounded-lg border border-subtle bg-surface-1 px-4 py-3">
          <Tarta datos={reparto} total={t.tareas} />
          <div className="flex min-w-0 flex-col gap-2">
            {reparto
              .filter((r) => r.valor > 0)
              .map((r) => (
                <div key={r.clave} className="flex items-center gap-2 text-12">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: COLORES[r.clave] }} />
                  <span className="text-secondary">{ETIQUETAS[r.clave]}</span>
                  <span className="text-primary tabular-nums">{r.valor}</span>
                  <span className="text-tertiary tabular-nums">
                    {t.tareas ? Math.round((r.valor / t.tareas) * 100) : 0}%
                  </span>
                </div>
              ))}
            <div className="mt-1 border-t border-subtle pt-1.5 text-11 text-tertiary">
              {t.proyectos} departamento{t.proyectos === 1 ? "" : "s"} · {horas(t.segundos)} invertidas
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <KPI
            etiqueta="Proyectos completados"
            valor={`${t.porcentaje_proyectos}%`}
            detalle={`${t.proyectos_completados} de ${t.proyectos}`}
            acento="text-accent-primary"
          />
          <KPI
            etiqueta="Tareas completadas"
            valor={`${t.porcentaje_tareas}%`}
            detalle={`${t.hechas} de ${t.tareas}`}
            acento="text-accent-primary"
          />
          <KPI etiqueta="Tiempo invertido" valor={horas(t.segundos)} detalle="en todo el espacio" />
          <KPI
            etiqueta="Tareas vencidas"
            valor={String(t.vencidas)}
            detalle={t.abiertas ? `${t.abiertas} abiertas` : "sin abiertas"}
            acento={t.vencidas ? "text-danger-primary" : undefined}
          />
        </div>
      </div>

      {/* Derecha: departamentos */}
      <div className="flex flex-col gap-3">
        <h3 className="text-14 font-medium text-primary">
          Departamentos <span className="font-normal text-11 text-tertiary">· pulsa para ver sus tareas</span>
        </h3>

        <div className="overflow-hidden rounded-lg border border-subtle">
          <div className="grid grid-cols-12 gap-2 border-b border-subtle bg-layer-1 px-4 py-2 text-10 font-medium tracking-wide text-tertiary uppercase">
            <span className="col-span-4">Departamento</span>
            <span className="col-span-4">Avance</span>
            <span className="col-span-2 text-right">Tareas</span>
            <span className="col-span-2 text-right">Tiempo</span>
          </div>
          {departamentos.map((d) => (
            <FilaDepartamento
              key={d.id}
              d={d}
              workspaceSlug={workspaceSlug}
              abierto={abierto === d.id}
              onToggle={() => setAbierto(abierto === d.id ? null : d.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
