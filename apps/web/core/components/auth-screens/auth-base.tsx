/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// CatarGroup: acceso con la identidad corporativa de Grupo Romboc.
// Split-screen: formulario a la izquierda sobre blanco y panel de marca
// con degradado, curvas y logotipo a la derecha.
import React from "react";
import { AuthRoot } from "@/components/account/auth-forms/auth-root";
import type { EAuthModes } from "@/helpers/authentication.helper";

type AuthBaseProps = {
  authType: EAuthModes;
};

export function AuthBase({ authType }: AuthBaseProps) {
  return (
    <div className="romboc-auth">
      <div className="romboc-auth__left">
        <header className="romboc-auth__head">
          <img src="/brand/romboc-mark.png" alt="" aria-hidden className="romboc-auth__mark" />
          <span className="romboc-auth__brandtext">Grupo Romboc</span>
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
        <span className="romboc-auth__arc romboc-auth__arc--top" aria-hidden />
        <span className="romboc-auth__arc romboc-auth__arc--mid" aria-hidden />
        <span className="romboc-auth__arc romboc-auth__arc--bottom" aria-hidden />
        <img src="/brand/romboc-logo-light.png" alt="Grupo Romboc" className="romboc-auth__logo-big" />
        <div className="romboc-auth__right-foot">
          <span>gruporomboc.com</span>
          <span>ruben.amaya@catargroup.com</span>
        </div>
      </aside>
    </div>
  );
}
