/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Collapsible } from "@plane/propel/collapsible";
import { ChevronDownIcon } from "@plane/propel/icons";
import type { E_SORT_ORDER, TActivityFilters, EActivityFilterType } from "@plane/constants";
import { BASE_ACTIVITY_FILTER_TYPES, filterActivityOnSelectedFilters } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TCommentsOperations } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { CommentCard } from "@/components/comments/card/root";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { IssueActivityItem } from "./activity/activity-list";
import { IssueActivityLoader } from "./loader";

type TIssueActivityCommentRoot = {
  workspaceSlug: string;
  projectId: string;
  isIntakeIssue: boolean;
  issueId: string;
  selectedFilters: TActivityFilters[];
  activityOperations: TCommentsOperations;
  showAccessSpecifier?: boolean;
  disabled?: boolean;
  sortOrder: E_SORT_ORDER;
};

export const IssueActivityCommentRoot = observer(function IssueActivityCommentRoot(props: TIssueActivityCommentRoot) {
  const {
    workspaceSlug,
    isIntakeIssue,
    issueId,
    selectedFilters,
    activityOperations,
    showAccessSpecifier,
    projectId,
    disabled,
    sortOrder,
  } = props;
  // store hooks
  const {
    activity: { getActivityAndCommentsByIssueId },
    comment: { getCommentById },
  } = useIssueDetail();
  // i18n
  const { t } = useTranslation();
  // state
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  // derived values
  const activityAndComments = getActivityAndCommentsByIssueId(issueId, sortOrder);

  if (!activityAndComments) return <IssueActivityLoader />;

  if (activityAndComments.length <= 0) return null;

  const filteredActivityAndComments = filterActivityOnSelectedFilters(activityAndComments, selectedFilters);

  // comments together, chat-style, in chronological order
  const comments = filteredActivityAndComments.filter(
    (activityComment) => activityComment.activity_type === "COMMENT"
  );
  // everything else (attachments, field changes...) grouped separately, collapsed by default
  const activities = filteredActivityAndComments.filter(
    (activityComment) =>
      activityComment.activity_type !== "COMMENT" &&
      BASE_ACTIVITY_FILTER_TYPES.includes(activityComment.activity_type as EActivityFilterType)
  );

  return (
    <div className="space-y-3">
      {comments.length > 0 && (
        <div>
          {comments.map((activityComment, index) => {
            const comment = getCommentById(activityComment.id);
            return (
              <CommentCard
                key={activityComment.id}
                workspaceSlug={workspaceSlug}
                entityId={issueId}
                comment={comment}
                activityOperations={activityOperations}
                ends={index === 0 ? "top" : index === comments.length - 1 ? "bottom" : undefined}
                showAccessSpecifier={!!showAccessSpecifier}
                showCopyLinkOption={!isIntakeIssue}
                disabled={disabled}
                projectId={projectId}
                enableReplies
              />
            );
          })}
        </div>
      )}

      {activities.length > 0 && (
        <Collapsible.CollapsibleRoot
          isOpen={isActivityOpen}
          onToggle={() => setIsActivityOpen((prev) => !prev)}
        >
          <Collapsible.CollapsibleTrigger className="flex w-full items-center justify-between gap-2 py-1">
            <span className="inline-flex items-center gap-2 text-caption-sm-medium text-secondary">
              {t("common.activity")}
              <span className="text-14 leading-3! text-tertiary">{activities.length}</span>
            </span>
            <ChevronDownIcon
              className={cn("size-4 shrink-0 text-tertiary transition-transform", { "rotate-180": isActivityOpen })}
            />
          </Collapsible.CollapsibleTrigger>
          <Collapsible.CollapsibleContent>
            <div>
              {activities.map((activityComment, index) => (
                <IssueActivityItem
                  key={activityComment.id}
                  activityId={activityComment.id}
                  ends={index === 0 ? "top" : index === activities.length - 1 ? "bottom" : undefined}
                />
              ))}
            </div>
          </Collapsible.CollapsibleContent>
        </Collapsible.CollapsibleRoot>
      )}
    </div>
  );
});
