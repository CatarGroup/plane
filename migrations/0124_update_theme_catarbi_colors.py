# Grupo Romboc / Catar BI — overlay
#
# La 0123 forzo "Tema Catar Bi" (custom) con una paleta azul/marino
# propia. Se ha decidido que use los mismos colores que "Preferencia
# del Sistema" en su lugar (ver THEME_OPTIONS en
# packages/constants/src/themes.ts). Como la 0123 ya se aplico, cambiar
# ahi la constante no re-ejecuta nada: hace falta esta migracion nueva
# para que los perfiles YA EXISTENTES tambien reciban el color corregido.
#
# Se copia a apps/api/plane/db/migrations/ en el build (ver Dockerfile)
# y corre sola: la imagen AIO arranca "migrator" (manage.py migrate) en
# cada boot (deployments/aio/community/supervisor.conf).
#
# Irreversible a proposito: no guardamos el valor anterior de cada
# usuario, asi que el "reverse" no puede restaurarlo (deja el mismo
# valor forzado en vez de fallar el rollback).

from django.db import migrations

NUEVO_TEMA_CATARBI = {
    "theme": "custom",
    "primary": "#3F76FF",
    "background": "#FAFAFA",
    "darkPalette": False,
}


def aplicar_nuevo_tema(apps, schema_editor):
    Profile = apps.get_model("db", "Profile")
    Profile.objects.all().update(theme=NUEVO_TEMA_CATARBI)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0123_set_theme_catarbi_default"),
    ]

    operations = [
        migrations.RunPython(aplicar_nuevo_tema, noop),
    ]
