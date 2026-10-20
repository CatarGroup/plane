/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// CatarGroup: layout de acceso con la identidad corporativa de Grupo Romboc
// (split-screen: formulario a la izquierda, panel de marca a la derecha).
import React from "react";
import { AuthRoot } from "@/components/account/auth-forms/auth-root";
import type { EAuthModes } from "@/helpers/authentication.helper";

type AuthBaseProps = {
  authType: EAuthModes;
};

const LOGO_DARK =
  "https://crm.gruporomboc.com/assets/enterprises/gruporomboc/logos/logo-dark.png";
const LOGO_LIGHT =
  "https://crm.gruporomboc.com/assets/enterprises/gruporomboc/logos/logo-light.png";

export function AuthBase({ authType }: AuthBaseProps) {
  return (
    <div className="romboc-auth">
      <div className="romboc-auth__left">
        <header className="romboc-auth__head">
          <img src={LOGO_DARK} alt="Grupo Romboc" className="romboc-auth__logo" />
        </header>
        <main className="romboc-auth__body">
          <AuthRoot authMode={authType} />
        </main>
        <footer className="romboc-auth__legal">
          <a href="https://www.gruporomboc.com" target="_blank" rel="noreferrer">
            Politica de privacidad
          </a>
        </footer>
      </div>
      <aside className="romboc-auth__right">
        <img src={LOGO_LIGHT} alt="Grupo Romboc" className="romboc-auth__logo-big" />
        <div className="romboc-auth__right-foot">
          <span>gruporomboc.com</span>
          <span>sistemas@gruporomboc.com</span>
        </div>
      </aside>
    </div>
  );
}
