/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * CatarGroup: "Tiempo invertido" (estilo Toggl).
 * Cada tramo es una fila; se acumulan por tarea. Entrada manual
 * con desplegables de hora, o cronometro.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
// ui
import { ChevronDown, ChevronRight, Clock, Plus, Trash2 } from "lucide-react";
// services
import { IssueTimeLogService, type TIssueTimeLog } from "@/services/issue/issue_time_log.service";
import { invalidarTotales } from "@/hooks/use-project-time-summary";

const timeLogService = new IssueTimeLogService();

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = ["00", "15", "30", "45"];

const humano = (segundos: number) => {
  const totalMin = Math.round((segundos || 0) / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
};

interface Props {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
}

export const IssueTimeLogs = observer(function IssueTimeLogs({
  workspaceSlug,
  projectId,
  issueId,
  disabled = false,
}: Props) {
  const [registros, setRegistros] = useState<TIssueTimeLog[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [formulario, setFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // formulario
  const hoy = format(new Date(), "yyyy-MM-dd");
  const [fecha, setFecha] = useState(hoy);
  const [horaIni, setHoraIni] = useState("09");
  const [minIni, setMinIni] = useState("00");
  const [horaFin, setHoraFin] = useState("12");
  const [minFin, setMinFin] = useState("00");
  const [nota, setNota] = useState("");

  const cargar = async () => {
    try {
      const data = await timeLogService.list(workspaceSlug, projectId, issueId);
      setRegistros(data?.results ?? []);
      setTotal(data?.total_seconds ?? 0);
    } catch {
      setRegistros([]);
      setTotal(0);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setCargando(true);
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId]);

  const guardar = async () => {
    setError(null);
    const ini = new Date(`${fecha}T${horaIni}:${minIni}:00`);
    const fin = new Date(`${fecha}T${horaFin}:${minFin}:00`);
    if (Number.isNaN(ini.getTime()) || Number.isNaN(fin.getTime())) {
      setError("Fecha u hora no válidas.");
      return;
    }
    if (fin <= ini) {
      setError("La hora de fin debe ser posterior a la de inicio.");
      return;
    }
    setGuardando(true);
    try {
      await timeLogService.create(workspaceSlug, projectId, issueId, {
        started_at: ini.toISOString(),
        ended_at: fin.toISOString(),
        description: nota,
      });
      setNota("");
      setFormulario(false);
      invalidarTotales(projectId);
      await cargar();
    } catch {
      setError("No se pudo guardar el tiempo.");
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (id: string) => {
    if (!window.confirm("¿Borrar este tramo de tiempo?")) return;
    await timeLogService.destroy(workspaceSlug, projectId, issueId, id);
    invalidarTotales(projectId);
    await cargar();
  };

  // agrupar por dia
  const porDia = registros.reduce<Record<string, TIssueTimeLog[]>>((acc, r) => {
    const dia = format(parseISO(r.started_at), "yyyy-MM-dd");
    (acc[dia] = acc[dia] ?? []).push(r);
    return acc;
  }, {});
  const dias = Object.keys(porDia).sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="rounded-sm border border-subtle bg-layer-3 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-1.5 text-body-xs-medium text-secondary hover:text-primary"
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          <Clock className="size-3.5" />
          Tiempo invertido
          <span className="ml-1 rounded-sm bg-layer-1 px-1.5 py-0.5 text-body-xs-medium text-primary">
            {humano(total)}
          </span>
          <span className="text-tertiary">({registros.length})</span>
        </button>
        {!disabled && (
          <button
            type="button"
            onClick={() => {
              setAbierto(true);
              setFormulario((v) => !v);
            }}
            className="flex h-7 items-center gap-1 rounded-sm border border-subtle px-2 text-body-xs-medium text-secondary hover:bg-layer-1"
          >
            <Plus className="size-3.5" /> Añadir
          </button>
        )}
      </div>

      {abierto && (
        <div className="mt-3 space-y-3">
          {formulario && !disabled && (
            <div className="rounded-sm border border-subtle bg-layer-1 p-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-body-xs-regular text-tertiary">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="h-7 rounded-sm border border-subtle bg-surface-1 px-2 text-body-xs-regular"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-body-xs-regular text-tertiary">Desde</label>
                  <div className="flex items-center gap-1">
                    <select
                      value={horaIni}
                      onChange={(e) => setHoraIni(e.target.value)}
                      className="h-7 rounded-sm border border-subtle bg-surface-1 px-1 text-body-xs-regular"
                    >
                      {HORAS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span>:</span>
                    <select
                      value={minIni}
                      onChange={(e) => setMinIni(e.target.value)}
                      className="h-7 rounded-sm border border-subtle bg-surface-1 px-1 text-body-xs-regular"
                    >
                      {MINUTOS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-body-xs-regular text-tertiary">Hasta</label>
                  <div className="flex items-center gap-1">
                    <select
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      className="h-7 rounded-sm border border-subtle bg-surface-1 px-1 text-body-xs-regular"
                    >
                      {HORAS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span>:</span>
                    <select
                      value={minFin}
                      onChange={(e) => setMinFin(e.target.value)}
                      className="h-7 rounded-sm border border-subtle bg-surface-1 px-1 text-body-xs-regular"
                    >
                      {MINUTOS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={guardando}
                  className="h-7 rounded-sm bg-accent-primary px-3 text-body-xs-medium text-on-color hover:opacity-90 disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setFormulario(false)}
                  className="h-7 rounded-sm px-2 text-body-xs-regular text-tertiary hover:text-primary"
                >
                  Cancelar
                </button>
              </div>
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="¿En qué se fue el tiempo? (opcional)"
                className="mt-2 h-7 w-full rounded-sm border border-subtle bg-surface-1 px-2 text-body-xs-regular"
              />
              {error && <p className="mt-1 text-body-xs-regular text-danger-primary">{error}</p>}
            </div>
          )}

          {cargando && <p className="text-body-xs-regular text-tertiary">Cargando...</p>}

          {!cargando && registros.length === 0 && (
            <p className="text-body-xs-regular text-tertiary">Todavía no hay tiempo registrado en esta tarea.</p>
          )}

          {dias.map((dia) => {
            const items = porDia[dia];
            const totalDia = items.reduce((s, r) => s + (r.duration_seconds || 0), 0);
            return (
              <div key={dia}>
                <div className="flex items-center gap-2 border-b border-subtle pb-1">
                  <span className="text-body-xs-medium capitalize text-primary">
                    {format(parseISO(dia), "EEEE d 'de' MMMM", { locale: es })}
                  </span>
                  <span className="text-body-xs-regular text-tertiary">{humano(totalDia)}</span>
                </div>
                <ul className="mt-1 space-y-1">
                  {items.map((r) => (
                    <li key={r.id} className="group flex items-center gap-2 text-body-xs-regular">
                      <span className="w-28 shrink-0 tabular-nums text-secondary">
                        {format(parseISO(r.started_at), "HH:mm")}
                        {r.ended_at ? ` – ${format(parseISO(r.ended_at), "HH:mm")}` : " · en curso"}
                      </span>
                      <span className="w-20 shrink-0 font-medium text-primary">{humano(r.duration_seconds)}</span>
                      <span className="shrink-0 text-tertiary">{r.user_detail?.display_name}</span>
                      {r.description && <span className="truncate text-secondary">· {r.description}</span>}
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => borrar(r.id)}
                          className="ml-auto hidden size-5 items-center justify-center rounded-sm text-tertiary hover:text-danger-primary group-hover:flex"
                          title="Borrar"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
