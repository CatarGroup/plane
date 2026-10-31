/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
// plane imports
import { FORCED_THEME } from "@plane/constants";
import { clearCustomTheme } from "@plane/utils";
// helpers
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useRouterParams } from "@/hooks/store/use-router-params";
import { useUserProfile } from "@/hooks/store/user";

type TStoreWrapper = {
  children: ReactNode;
};

function StoreWrapper(props: TStoreWrapper) {
  const { children } = props;
  // theme
  const { setTheme } = useTheme();
  // router
  const params = useParams();
  // store hooks
  const { setQuery } = useRouterParams();
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  const { data: userProfile, updateUserTheme } = useUserProfile();
  // Track if we've initialized theme from server (one-time only)
  const hasInitializedThemeRef = useRef(false);
  // Track current user to reset on logout/login
  const currentUserIdRef = useRef<string | undefined>(undefined);

  /**
   * Sidebar collapsed fetching from local storage
   */
  useEffect(() => {
    const localValue = localStorage && localStorage.getItem("app_sidebar_collapsed");
    const localBoolValue = localValue ? (localValue === "true" ? true : false) : false;
    if (localValue && sidebarCollapsed === undefined) toggleSidebar(localBoolValue);
  }, [sidebarCollapsed, setTheme, toggleSidebar]);

  /**
   * Effect 1: tema SIEMPRE del sistema (Catar BI)
   *
   * Antes se cargaba el tema guardado en el perfil del usuario. Ahora se ignora:
   * el script del <head> pisa el localStorage («theme» = system) y aquí se
   * vuelve a fijar «system» por si algo lo hubiera cambiado.
   */
  useEffect(() => {
    const userId = userProfile?.id;

    // Reset initialization flag when user changes (logout/login)
    // This handles both logout (userId becomes undefined) and login (userId changes)
    if (userId !== currentUserIdRef.current) {
      hasInitializedThemeRef.current = false;
      currentUserIdRef.current = userId;
    }

    // El tema nunca se toma del perfil: siempre el del sistema.
    setTheme(FORCED_THEME);

    // Una sola normalización por sesión: si el perfil tenía otro tema guardado
    // (claro/oscuro/custom), se pasa a «system» en el servidor para que no se
    // cuele por ninguna otra vía.
    if (hasInitializedThemeRef.current) return;
    if (!userProfile?.theme?.theme) return;
    hasInitializedThemeRef.current = true;
    if (userProfile.theme.theme !== FORCED_THEME) void updateUserTheme({ theme: FORCED_THEME });
  }, [userProfile?.id, userProfile?.theme?.theme, setTheme, updateUserTheme]);

  /**
   * Effect 2: fuera paletas personalizadas (Catar BI)
   *
   * Con el tema del sistema no se aplican colores propios: si el usuario tenía
   * un tema «custom» guardado, se limpian sus variables CSS al cargar.
   */
  useEffect(() => {
    clearCustomTheme();
  }, [userProfile?.id]);

  useEffect(() => {
    if (!params) return;
    setQuery(params);
  }, [params, setQuery]);

  return <>{children}</>;
}

export default observer(StoreWrapper);
