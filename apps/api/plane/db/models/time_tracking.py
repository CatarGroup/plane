# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Grupo Romboc / Catar BI — time tracker tipo Toggl.

from django.conf import settings
from django.db import models
from django.utils import timezone

from .project import ProjectBaseModel


class TimeEntry(ProjectBaseModel):
    """Una entrada de tiempo (cronometro) atada a una tarea (Issue).

    `ended_at` es null mientras el cronometro esta corriendo. Solo puede
    haber UNA entrada corriendo por usuario a la vez (se garantiza en la
    vista, no aqui: al arrancar un cronometro nuevo se para el anterior).
    """

    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="time_entries")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="time_entries")
    description = models.TextField(blank=True)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    duration = models.PositiveIntegerField(default=0, help_text="Segundos. Se calcula al parar el cronometro.")

    class Meta:
        verbose_name = "Time Entry"
        verbose_name_plural = "Time Entries"
        db_table = "time_entries"
        ordering = ("-started_at",)
        indexes = [
            models.Index(fields=["workspace", "user", "ended_at"], name="time_entry_running_idx"),
            models.Index(fields=["issue"], name="time_entry_issue_idx"),
            models.Index(fields=["workspace", "started_at"], name="time_entry_week_idx"),
        ]

    @property
    def is_running(self):
        return self.ended_at is None

    def stop(self):
        if self.ended_at is not None:
            return
        self.ended_at = timezone.now()
        self.duration = max(0, int((self.ended_at - self.started_at).total_seconds()))
        self.save()

    def __str__(self):
        return f"{self.user_id} · {self.issue_id} · {self.started_at}"
