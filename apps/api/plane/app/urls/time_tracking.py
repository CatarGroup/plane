# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Grupo Romboc / Catar BI — time tracker tipo Toggl.

from django.urls import path

from plane.app.views import (
    TimeEntryStartEndpoint,
    TimeEntryStopEndpoint,
    TimeEntryRunningEndpoint,
    TimeEntryListEndpoint,
    TimeEntryDetailEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/time-entries/start/",
        TimeEntryStartEndpoint.as_view(),
        name="time-entry-start",
    ),
    path(
        "workspaces/<str:slug>/time-entries/<uuid:pk>/stop/",
        TimeEntryStopEndpoint.as_view(),
        name="time-entry-stop",
    ),
    path(
        "workspaces/<str:slug>/time-entries/running/",
        TimeEntryRunningEndpoint.as_view(),
        name="time-entry-running",
    ),
    path(
        "workspaces/<str:slug>/time-entries/",
        TimeEntryListEndpoint.as_view(),
        name="time-entry-list",
    ),
    path(
        "workspaces/<str:slug>/time-entries/<uuid:pk>/",
        TimeEntryDetailEndpoint.as_view(),
        name="time-entry-detail",
    ),
]
