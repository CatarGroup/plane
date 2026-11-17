/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS } from "@plane/constants";
// local imports
import { SidebarItemBase } from "./sidebar-item";

export const SidebarMenuItems = observer(function SidebarMenuItems() {
  // Menú mínimo e igual para todos: solo Inicio.
  // El bloque «Espacio de trabajo» se oculta a propósito (Proyectos, Vistas y Analíticas
  // viven dentro de cada Departamento en la sección de Departamentos).
  const filteredStaticNavigationItems = useMemo(
    () => WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS.filter((item) => item.key === "home"),
    []
  );

  return (
    <div className="flex flex-col gap-0.5">
      {filteredStaticNavigationItems.map((item, _index) => (
        // oxlint-disable-next-line react/no-array-index-key
        <SidebarItemBase key={`static_${_index}`} item={item} />
      ))}
    </div>
  );
});
