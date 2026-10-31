/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { SettingsControlItem } from "@/components/settings/control-item";

/**
 * Catar BI: el tema ya no se puede elegir. La interfaz sigue SIEMPRE la
 * preferencia del sistema (claro u oscuro automático), así que en Ajustes →
 * Preferencias solo se informa de ello. El selector anterior escribía en
 * localStorage y en el perfil del usuario; ambas cosas se ignoran ahora.
 */
export const ThemeSwitcher = observer(function ThemeSwitcher(props: {
  option: {
    id: string;
    title: string;
    description: string;
  };
}) {
  // translation
  const { t } = useTranslation();

  return (
    <SettingsControlItem
      title={t(props.option.title)}
      description={t(props.option.description)}
      control={
        <span className="rounded-md border border-subtle-1 bg-layer-2 px-3 py-1.5 text-body-sm-regular text-secondary">
          {t("system_preference")}
        </span>
      }
    />
  );
});
