/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Tarjeta de enlace rápido (Inicio). El color y el icono se asignan por orden de la lista y la
 * descripción sale de `metadata.description`; si no hay, se enseña el dominio.
 */

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";

import { useTranslation } from "@plane/i18n";
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useHome } from "@/hooks/store/use-home";
// types
import type { TLinkOperations } from "./use-links";

export type TProjectLinkDetail = {
  linkId: string;
  index: number;
  linkOperations: TLinkOperations;
};

// paleta: por orden (1º azul, 2º ámbar, 3º verde…)
const COLORES = ["#2563eb", "#d97706", "#0d9488", "#7c3aed", "#dc2626", "#0891b2", "#65a30d", "#db2777"];

const ICONOS: { claves: string[]; path: string }[] = [
  {
    claves: ["noticia", "recopilador", "prensa", "blog"],
    path: "M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2M18 14h-8M15 18h-5M10 6h8v4h-8z",
  },
  {
    claves: ["licitacion", "fotovolt", "solar", "energia"],
    path: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41",
  },
  {
    claves: ["fixner", "parte", "tecnico", "sat", "taller"],
    path: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  },
  {
    claves: ["crm", "cliente", "portal", "comercial"],
    path: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
  {
    claves: ["zabbix", "monitor", "glpi", "inventario", "grafana"],
    path: "M3 3v18h18M7 15l4-4 3 3 5-6",
  },
];

export const ProjectLinkDetail = observer(function ProjectLinkDetail(props: TProjectLinkDetail) {
  // props
  const { linkId, index, linkOperations } = props;
  // hooks
  const {
    quickLinks: { getLinkById, toggleLinkModal, setLinkData },
  } = useHome();
  const { t } = useTranslation();
  // derived values
  const linkDetail = getLinkById(linkId);
  const linkUrl = linkDetail?.url;
  const color = COLORES[index % COLORES.length];

  const icono = useMemo(() => {
    const texto = `${linkDetail?.title ?? ""} ${linkUrl ?? ""}`.toLowerCase();
    return ICONOS.find((i) => i.claves.some((c) => texto.includes(c)))?.path ?? ICONOS[0].path;
  }, [linkDetail?.title, linkUrl]);

  const descripcion = useMemo(() => {
    const meta = (linkDetail as unknown as { metadata?: { description?: string } })?.metadata;
    if (meta?.description) return meta.description;
    if (!linkUrl) return "";
    try {
      return new URL(linkUrl).hostname.replace(/^www\./, "");
    } catch {
      return linkUrl;
    }
  }, [linkDetail, linkUrl]);

  // handlers
  const handleOpenInNewTab = useCallback(() => {
    if (!linkUrl) return;
    window.open(linkUrl, "_blank", "noopener,noreferrer");
  }, [linkUrl]);

  const handleEdit = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      toggleLinkModal(true);
      setLinkData(linkDetail);
    },
    [linkDetail, setLinkData, toggleLinkModal]
  );

  const handleDelete = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      linkOperations.remove(linkId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("deleted"), message: t("link.deleted") });
    },
    [linkId, linkOperations, t]
  );

  if (!linkDetail) return null;

  return (
    <div
      className="group relative flex items-start gap-2.5 rounded-[10px] border border-subtle px-3 py-2.5
                 transition-[background,border-color,transform] duration-150 hover:-translate-y-px hover:shadow-sm"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: color,
        background: `color-mix(in srgb, ${color} 6%, var(--background))`,
      }}
    >
      <button type="button" onClick={handleOpenInNewTab} className="flex min-w-0 flex-1 items-start gap-2.5 text-left">
        <span className="grid size-7 flex-none place-items-center rounded-[7px] text-on-color" style={{ background: color }}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d={icono} />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-13 font-medium text-primary">{linkDetail.title || linkUrl}</span>
          <span className="mt-0.5 line-clamp-2 block text-11 text-tertiary">{descripcion}</span>
        </span>
      </button>

      <span className="absolute top-1.5 right-1.5 hidden gap-0.5 group-hover:flex">
        <button type="button" onClick={handleEdit} title={t("edit")} className="rounded p-1 text-tertiary hover:bg-surface-2 hover:text-primary">
          <EditIcon className="size-3.5" />
        </button>
        <button type="button" onClick={handleDelete} title={t("delete")} className="rounded p-1 text-tertiary hover:bg-surface-2 hover:text-danger-primary">
          <TrashIcon className="size-3.5" />
        </button>
      </span>
    </div>
  );
});
