# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Grupo Romboc / Catar BI — time tracker tipo Toggl.
# Un cronometro por usuario a la vez: arrancar uno nuevo para el anterior
# si habia alguno corriendo.

from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import TimeEntrySerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, TimeEntry, Workspace


class TimeEntryStartEndpoint(BaseAPIView):
    """POST: arranca un cronometro atado a una tarea. Para el que ya
    estuviera corriendo (si habia uno) antes de arrancar el nuevo."""

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        issue_id = request.data.get("issue_id")
        if not issue_id:
            return Response({"error": "issue_id es obligatorio"}, status=status.HTTP_400_BAD_REQUEST)

        workspace = Workspace.objects.get(slug=slug)
        issue = Issue.objects.filter(pk=issue_id, workspace=workspace).first()
        if issue is None:
            return Response({"error": "Tarea no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        running = TimeEntry.objects.filter(workspace=workspace, user=request.user, ended_at__isnull=True).first()
        if running is not None:
            running.stop()

        entry = TimeEntry.objects.create(
            workspace=workspace,
            project=issue.project,
            issue=issue,
            user=request.user,
            description=request.data.get("description", ""),
            started_at=timezone.now(),
        )
        serializer = TimeEntrySerializer(entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TimeEntryStopEndpoint(BaseAPIView):
    """POST: para el cronometro indicado (si es del usuario y sigue
    corriendo). Idempotente: si ya estaba parado, devuelve el mismo dato."""

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, pk):
        entry = TimeEntry.objects.filter(pk=pk, workspace__slug=slug, user=request.user).first()
        if entry is None:
            return Response({"error": "No encontrado"}, status=status.HTTP_404_NOT_FOUND)
        entry.stop()
        return Response(TimeEntrySerializer(entry).data, status=status.HTTP_200_OK)


class TimeEntryRunningEndpoint(BaseAPIView):
    """GET: el cronometro corriendo del usuario actual, o null. Para
    restaurar el estado del boton al recargar la pagina."""

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        entry = TimeEntry.objects.filter(workspace__slug=slug, user=request.user, ended_at__isnull=True).first()
        if entry is None:
            return Response(None, status=status.HTTP_200_OK)
        return Response(TimeEntrySerializer(entry).data, status=status.HTTP_200_OK)


class TimeEntryListEndpoint(BaseAPIView):
    """GET: entradas de tiempo. Por defecto solo las del usuario actual;
    con ?team=true, las de todo el workspace (vista de equipo). Filtra
    por semana con ?week_start=YYYY-MM-DD (lunes de esa semana)."""

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        team = request.GET.get("team", "false").lower() == "true"
        week_start = request.GET.get("week_start")

        qs = TimeEntry.objects.filter(workspace__slug=slug).select_related("issue", "user", "project")
        if not team:
            qs = qs.filter(user=request.user)

        if week_start:
            try:
                start = timezone.datetime.fromisoformat(week_start)
            except ValueError:
                return Response({"error": "week_start invalido, usar YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)
            if timezone.is_naive(start):
                start = timezone.make_aware(start)
            end = start + timedelta(days=7)
            qs = qs.filter(started_at__gte=start, started_at__lt=end)

        serializer = TimeEntrySerializer(qs.order_by("-started_at"), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TimeEntryDetailEndpoint(BaseAPIView):
    """PATCH: editar descripcion/horas de una entrada ya parada.
    DELETE: borrar una entrada (propia)."""

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, pk):
        entry = TimeEntry.objects.filter(pk=pk, workspace__slug=slug, user=request.user).first()
        if entry is None:
            return Response({"error": "No encontrado"}, status=status.HTTP_404_NOT_FOUND)
        serializer = TimeEntrySerializer(entry, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, pk):
        entry = TimeEntry.objects.filter(pk=pk, workspace__slug=slug, user=request.user).first()
        if entry is None:
            return Response({"error": "No encontrado"}, status=status.HTTP_404_NOT_FOUND)
        entry.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
