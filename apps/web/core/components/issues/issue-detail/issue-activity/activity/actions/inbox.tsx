/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// hooks
import { IntakeIcon } from "@plane/propel/icons";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { IssueActivityBlockComponent } from "./";
// icons

type TIssueInboxActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueInboxActivity = observer(function IssueInboxActivity(props: TIssueInboxActivity) {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  const getInboxActivityMessage = () => {
    switch (activity?.verb) {
      case "-1":
        return "rechazó esta tarea desde la bandeja de entrada.";
      case "0":
        return "pospuso esta tarea.";
      case "1":
        return "aceptó esta tarea desde la bandeja de entrada.";
      case "2":
        return "rechazó esta tarea desde la bandeja de entrada marcándola como duplicada.";
      default:
        return "actualizó el estado de la tarea en la bandeja de entrada.";
    }
  };

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<IntakeIcon className="h-4 w-4 flex-shrink-0 text-secondary" />}
      activityId={activityId}
      ends={ends}
    >
      <>{getInboxActivityMessage()}</>
    </IssueActivityBlockComponent>
  );
});
