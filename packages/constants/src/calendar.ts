/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCalendarLayouts } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";

export const MONTHS_LIST: {
  [monthNumber: number]: {
    shortTitle: string;
    title: string;
  };
} = {
  1: {
    shortTitle: "Ene",
    title: "Enero",
  },
  2: {
    shortTitle: "Feb",
    title: "Febrero",
  },
  3: {
    shortTitle: "Mar",
    title: "Marzo",
  },
  4: {
    shortTitle: "Abr",
    title: "Abril",
  },
  5: {
    shortTitle: "Mayo",
    title: "Mayo",
  },
  6: {
    shortTitle: "Jun",
    title: "Junio",
  },
  7: {
    shortTitle: "Jul",
    title: "Julio",
  },
  8: {
    shortTitle: "Ago",
    title: "Agosto",
  },
  9: {
    shortTitle: "Sep",
    title: "Septiembre",
  },
  10: {
    shortTitle: "Oct",
    title: "Octubre",
  },
  11: {
    shortTitle: "Nov",
    title: "Noviembre",
  },
  12: {
    shortTitle: "Dic",
    title: "Diciembre",
  },
};

export const DAYS_LIST: {
  [dayIndex: number]: {
    shortTitle: string;
    title: string;
    value: EStartOfTheWeek;
  };
} = {
  1: {
    shortTitle: "Dom",
    title: "Domingo",
    value: EStartOfTheWeek.SUNDAY,
  },
  2: {
    shortTitle: "Lun",
    title: "Lunes",
    value: EStartOfTheWeek.MONDAY,
  },
  3: {
    shortTitle: "Mar",
    title: "Martes",
    value: EStartOfTheWeek.TUESDAY,
  },
  4: {
    shortTitle: "Mié",
    title: "Miércoles",
    value: EStartOfTheWeek.WEDNESDAY,
  },
  5: {
    shortTitle: "Jue",
    title: "Jueves",
    value: EStartOfTheWeek.THURSDAY,
  },
  6: {
    shortTitle: "Vie",
    title: "Viernes",
    value: EStartOfTheWeek.FRIDAY,
  },
  7: {
    shortTitle: "Sáb",
    title: "Sábado",
    value: EStartOfTheWeek.SATURDAY,
  },
};

export const CALENDAR_LAYOUTS: {
  [layout in TCalendarLayouts]: {
    key: TCalendarLayouts;
    title: string;
  };
} = {
  month: {
    key: "month",
    title: "Vista mensual",
  },
  week: {
    key: "week",
    title: "Vista semanal",
  },
};
