# Time tracking: registros de tiempo por tarea (estilo Toggl)

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from plane.db.models import IssueTimeLog


class IssueTimeLogSerializer(BaseSerializer):
    user_detail = UserLiteSerializer(read_only=True, source="user")

    class Meta:
        model = IssueTimeLog
        fields = "__all__"
        read_only_fields = [
            "user",
            "workspace",
            "project",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        started_at = attrs.get("started_at") or (self.instance.started_at if self.instance else None)
        ended_at = attrs.get("ended_at", self.instance.ended_at if self.instance else None)
        is_running = attrs.get("is_running", self.instance.is_running if self.instance else False)

        # cronometro en marcha
        if is_running:
            attrs["is_running"] = True
            attrs["ended_at"] = None
            attrs["duration_seconds"] = 0
            return attrs

        if started_at and ended_at:
            if ended_at <= started_at:
                raise serializers.ValidationError({"ended_at": "La hora de fin debe ser posterior a la de inicio."})
            attrs["duration_seconds"] = int((ended_at - started_at).total_seconds())
            attrs["is_running"] = False
            return attrs

        # si llega solo duration_seconds (entrada manual rapida), se respeta
        if not attrs.get("duration_seconds") and not (self.instance and self.instance.duration_seconds):
            raise serializers.ValidationError(
                {"ended_at": "Indica la hora de fin (o una duracion en segundos)."}
            )
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
