/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EIssuesStoreType } from "@plane/types";
// i18n
import { useTranslation } from "@plane/i18n";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";

export const ProjectViewEmptyState = observer(function ProjectViewEmptyState() {
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();

  // auth
  const isCreatingIssueAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <EmptyStateDetailed
      assetKey="work-item"
      title={t("common.view_work_items_empty")}
      description="Work items help you track individual pieces of work. With work items, keep track of what's going on, who is working on it, and what's done."
      actions={[
        {
          label: "New work item",
          onClick: () => {
            toggleCreateIssueModal(true, EIssuesStoreType.PROJECT_VIEW);
          },
          disabled: !isCreatingIssueAllowed,
          variant: "primary",
        },
      ]}
    />
  );
});
