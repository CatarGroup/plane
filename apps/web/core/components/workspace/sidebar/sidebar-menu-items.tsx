/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import {
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS,
  WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS,
  WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS,
  WORKSPACE_SIDEBAR_STATIC_PINNED_NAVIGATION_ITEMS_LINKS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// store hooks
import useLocalStorage from "@/hooks/use-local-storage";
import { useWorkspaceNavigationPreferences } from "@/hooks/use-navigation-preferences";
import { SidebarItemBase } from "./sidebar-item";

export const SidebarMenuItems = observer(function SidebarMenuItems() {
  // routers
  const { setValue: toggleWorkspaceMenu, storedValue: isWorkspaceMenuOpen } = useLocalStorage<boolean>(
    "is_workspace_menu_open",
    false
  );

  // hooks
  const { preferences: workspacePreferences } = useWorkspaceNavigationPreferences();
  // translation
  const { t } = useTranslation();

  const toggleListDisclosure = (isOpen: boolean) => {
    toggleWorkspaceMenu(isOpen);
  };

  // Menú limpio e igual para todos: solo Inicio (Notas adhesivas, Tus tareas y Borradores fuera)
  const filteredStaticNavigationItems = useMemo(
    () => WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS.filter((item) => item.key === "home"),
    []
  );

  const sortedNavigationItems = useMemo(
    () =>
      // oxlint-disable-next-line oxc/no-map-spread
      WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS.map((item) => {
        const preference = workspacePreferences.items[item.key];
        return {
          ...item,
          sort_order: preference ? preference.sort_order : 0,
        };
      }).sort((a, b) => a.sort_order - b.sort_order),
    [workspacePreferences]
  );

  return (
    <>
      <div className="flex flex-col gap-0.5">
        {filteredStaticNavigationItems.map((item, _index) => (
          // oxlint-disable-next-line react/no-array-index-key
          <SidebarItemBase key={`static_${_index}`} item={item} />
        ))}
      </div>
      <Disclosure as="div" className="flex flex-col" defaultOpen={false}>
        <div className="group flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-placeholder hover:bg-layer-transparent-hover">
          <Disclosure.Button
            as="button"
            type="button"
            className="flex w-full items-center gap-1 text-left text-13 font-semibold whitespace-nowrap text-placeholder"
            onClick={() => toggleListDisclosure(!isWorkspaceMenuOpen)}
            aria-label={t(
              isWorkspaceMenuOpen
                ? "aria_labels.app_sidebar.close_workspace_menu"
                : "aria_labels.app_sidebar.open_workspace_menu"
            )}
          >
            <span className="text-13 font-semibold">{t("common.workspace")}</span>
          </Disclosure.Button>
          <div className="pointer-events-none flex items-center opacity-0 group-hover:pointer-events-auto group-hover:opacity-100">
            <Disclosure.Button
              as="button"
              type="button"
              className="flex-shrink-0 rounded-sm p-0.5 hover:bg-layer-1"
              onClick={() => toggleListDisclosure(!isWorkspaceMenuOpen)}
              aria-label={t(
                isWorkspaceMenuOpen
                  ? "aria_labels.app_sidebar.close_workspace_menu"
                  : "aria_labels.app_sidebar.open_workspace_menu"
              )}
            >
              <ChevronRightIcon
                className={cn("size-3 flex-shrink-0 transition-all", {
                  "rotate-90": isWorkspaceMenuOpen,
                })}
              />
            </Disclosure.Button>
          </div>
        </div>
        <Transition
          show={!!isWorkspaceMenuOpen}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          {isWorkspaceMenuOpen && (
            <Disclosure.Panel as="div" className="flex flex-col gap-0.5" static>
              <>
                {WORKSPACE_SIDEBAR_STATIC_PINNED_NAVIGATION_ITEMS_LINKS.map((item, _index) => (
                  // oxlint-disable-next-line react/no-array-index-key
                  <SidebarItemBase key={`static_${_index}`} item={item} />
                ))}
                {sortedNavigationItems.map((item, _index) => (
                  // oxlint-disable-next-line react/no-array-index-key
                  <SidebarItemBase key={`dynamic_${_index}`} item={item} />
                ))}
              </>
            </Disclosure.Panel>
          )}
        </Transition>
      </Disclosure>
    </>
  );
});
