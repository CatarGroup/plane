# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models

# Module imports
from .project import ProjectBaseModel


class IssueTimeLog(ProjectBaseModel):
    """Registro de tiempo dedicado a una tarea (estilo Toggl).

    Puede crearse de dos formas:
      - cronometro: started_at + ended_at, con is_running mientras corre
      - manual: started_at + ended_at + duration_seconds ya calculado
    """

    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="time_logs"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_time_logs",
    )
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True, default="")
    is_running = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Issue Time Log"
        verbose_name_plural = "Issue Time Logs"
        db_table = "issue_time_logs"
        ordering = ("-started_at",)
        indexes = [
            models.Index(fields=["issue", "user"]),
            models.Index(fields=["project", "started_at"]),
        ]

    def __str__(self):
        return f"{self.user_id} - {self.issue_id} - {self.duration_seconds}s"
