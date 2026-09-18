# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Grupo Romboc / Catar BI — time tracker tipo Toggl.

from rest_framework import serializers

from plane.db.models import TimeEntry


class TimeEntryIssueLiteSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    sequence_id = serializers.IntegerField()
    project_id = serializers.UUIDField()


class TimeEntryUserLiteSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    display_name = serializers.CharField()
    avatar_url = serializers.CharField(allow_null=True)


class TimeEntrySerializer(serializers.ModelSerializer):
    is_running = serializers.BooleanField(read_only=True)
    issue_detail = serializers.SerializerMethodField()
    user_detail = serializers.SerializerMethodField()

    class Meta:
        model = TimeEntry
        fields = [
            "id",
            "issue",
            "issue_detail",
            "project",
            "workspace",
            "user",
            "user_detail",
            "description",
            "started_at",
            "ended_at",
            "duration",
            "is_running",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "user",
            "duration",
            "is_running",
            "created_at",
            "updated_at",
        ]

    def get_issue_detail(self, obj):
        if not obj.issue_id:
            return None
        return TimeEntryIssueLiteSerializer(obj.issue).data

    def get_user_detail(self, obj):
        return TimeEntryUserLiteSerializer(
            {
                "id": obj.user_id,
                "display_name": obj.user.display_name,
                "avatar_url": obj.user.avatar_url or None,
            }
        ).data
