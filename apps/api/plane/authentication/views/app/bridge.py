# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Puente de identidad Plane -> apps de Catar Group.

Con la sesión de Plane ya validada, firma un token de 60 s y manda al usuario
al portero (authbridge), que lo canjea por la sesión común.
"""

import os
import secrets
import time
import urllib.parse

import jwt
from django.http import HttpResponseRedirect
from django.views import View

BRIDGE_URL = os.environ.get("BRIDGE_URL", "https://auth.catargroup.com")
BRIDGE_SECRET = os.environ.get("BRIDGE_SECRET", "")
BRIDGE_DESTINO = os.environ.get("BRIDGE_DESTINO", "https://recopilador.catargroup.com/")


class BridgeEndpoint(View):
    def get(self, request):
        if not getattr(request.user, "is_authenticated", False):
            return HttpResponseRedirect("/")

        destino = request.GET.get("rd") or BRIDGE_DESTINO
        if not destino.startswith("https://"):
            destino = BRIDGE_DESTINO

        ahora = int(time.time())
        token = jwt.encode(
            {
                "sub": request.user.email,
                "name": request.user.display_name,
                "uid": str(request.user.id),
                "iat": ahora,
                "exp": ahora + 60,
                "jti": secrets.token_hex(8),
            },
            BRIDGE_SECRET,
            algorithm="HS256",
        )
        return HttpResponseRedirect(
            f"{BRIDGE_URL}/bridge?"
            + urllib.parse.urlencode({"t": token, "rd": destino})
        )
