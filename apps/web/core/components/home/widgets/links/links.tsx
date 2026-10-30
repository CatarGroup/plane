/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// computed
import { useHome } from "@/hooks/store/use-home";
import { LinksEmptyState } from "../empty-states/links";
import { EWidgetKeys, WidgetLoader } from "../loaders";
import { ProjectLinkDetail } from "./link-detail";
import type { TLinkOperations } from "./use-links";

export type TLinkOperationsModal = Exclude<TLinkOperations, "create">;

export type TProjectLinkList = {
  linkOperations: TLinkOperationsModal;
  workspaceSlug: string;
};

export const ProjectLinkList = observer(function ProjectLinkList(props: TProjectLinkList) {
  // props
  const { linkOperations, workspaceSlug } = props;
  // hooks
  const {
    quickLinks: { getLinksByWorkspaceId },
  } = useHome();

  const links = getLinksByWorkspaceId(workspaceSlug);

  if (links === undefined) return <WidgetLoader widgetKey={EWidgetKeys.QUICK_LINKS} />;

  if (links.length === 0) return <LinksEmptyState />;

  return (
    <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      {links.map((linkId, index) => (
        <ProjectLinkDetail key={linkId} linkId={linkId} index={index} linkOperations={linkOperations} />
      ))}
    </div>
  );
});
