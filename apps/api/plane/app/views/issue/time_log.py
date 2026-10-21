# Time tracking: API de tiempos por tarea (estilo Toggl)

# Django imports
from django.db.models import Sum
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import IssueTimeLogSerializer
from plane.db.models import Issue, IssueTimeLog

from .base import BaseViewSet


class IssueTimeLogViewSet(BaseViewSet):
    """CRUD de registros de tiempo de una tarea.

    GET    .../issues/<issue_id>/time-logs/            -> lista (acumula, cada registro una fila)
    POST   .../issues/<issue_id>/time-logs/            -> crear (cronometro o manual)
    PATCH  .../issues/<issue_id>/time-logs/<pk>/       -> editar / parar el cronometro
    DELETE .../issues/<issue_id>/time-logs/<pk>/       -> borrar
    GET    .../issues/<issue_id>/time-logs/summary/    -> total de la tarea
    """

    model = IssueTimeLog
    serializer_class = IssueTimeLogSerializer

    def get_queryset(self):
        return (
            IssueTimeLog.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .select_related("user", "project", "workspace", "issue")
            .order_by("-started_at")
        )

    def _get_issue(self):
        return Issue.objects.get(
            pk=self.kwargs.get("issue_id"),
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id, issue_id):
        logs = self.get_queryset()
        data = IssueTimeLogSerializer(logs, many=True).data
        total = sum(l.duration_seconds or 0 for l in logs)
        return Response({"results": data, "total_seconds": total, "count": len(data)})

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def create(self, request, slug, project_id, issue_id):
        issue = self._get_issue()

        # un cronometro activo por usuario: si ya hay uno, lo paramos
        running = IssueTimeLog.objects.filter(
            workspace__slug=slug, project_id=project_id, issue_id=issue_id,
            user=request.user, is_running=True, deleted_at__isnull=True,
        ).first()
        if running and request.data.get("is_running"):
            running.ended_at = timezone.now()
            running.duration_seconds = int((running.ended_at - running.started_at).total_seconds())
            running.is_running = False
            running.save()

        serializer = IssueTimeLogSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save(issue=issue, project=issue.project, workspace=issue.workspace)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def partial_update(self, request, slug, project_id, issue_id, pk):
        log = self.get_queryset().filter(pk=pk).first()
        if not log:
            return Response({"error": "No encontrado"}, status=status.HTTP_404_NOT_FOUND)

        # parar el cronometro: calcula el tiempo transcurrido
        if request.data.get("is_running") is False and log.is_running:
            log.ended_at = timezone.now()
            log.duration_seconds = int((log.ended_at - log.started_at).total_seconds())
            log.is_running = False
            if "description" in request.data:
                log.description = request.data.get("description", "")
            log.save()
            return Response(IssueTimeLogSerializer(log).data)

        serializer = IssueTimeLogSerializer(log, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def destroy(self, request, slug, project_id, issue_id, pk):
        log = self.get_queryset().filter(pk=pk).first()
        if not log:
            return Response({"error": "No encontrado"}, status=status.HTTP_404_NOT_FOUND)
        log.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def summary(self, request, slug, project_id, issue_id):
        logs = self.get_queryset()
        por_usuario = (
            logs.values("user__display_name")
            .annotate(total=Sum("duration_seconds"))
            .order_by("-total")
        )
        return Response(
            {
                "issue_id": issue_id,
                "total_seconds": sum(l.duration_seconds or 0 for l in logs),
                "registros": logs.count(),
                "por_usuario": [
                    {"usuario": u["user__display_name"], "total_seconds": u["total"] or 0}
                    for u in por_usuario
                ],
            }
        )


class ProjectTimeLogSummaryEndpoint(APIView):
    """Totales de tiempo por tarea de un proyecto entero.

    Devuelve { "<issue_id>": segundos } para pintar el tiempo acumulado
    en las tarjetas del tablero y en la vista de lista sin N llamadas.
    """

    def get(self, request, slug, project_id):
        filas = (
            IssueTimeLog.objects.filter(workspace__slug=slug, project_id=project_id, deleted_at__isnull=True)
            .values("issue_id")
            .annotate(total=Sum("duration_seconds"))
        )
        totales = {str(f["issue_id"]): f["total"] or 0 for f in filas}
        return Response(
            {
                "totales": totales,
                "total_proyecto": sum(totales.values()),
                "tareas_con_tiempo": len(totales),
            }
        )
