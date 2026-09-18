# Grupo Romboc / Catar BI — overlay
#
# Backfill: fuerza "Tema Catar Bi" (custom) en TODOS los perfiles
# existentes, pisando lo que cada usuario tuviera elegido, para que el
# selector de Ajustes salga marcado igual para todos. El look visual ya
# se aplica a todos vía theme.css independientemente de este valor;
# esto es solo para que el desplegable no quede inconsistente.
#
# Se copia a apps/api/plane/db/migrations/ en el build (ver Dockerfile)
# y corre sola: la imagen AIO arranca "migrator" (manage.py migrate) en
# cada boot (deployments/aio/community/supervisor.conf).
#
# Irreversible a propósito: no guardamos el valor anterior de cada
# usuario, así que el "reverse" no puede restaurarlo (deja el mismo
# valor forzado en vez de fallar el rollback).

from django.db import migrations

CATARBI_THEME = {
    "theme": "custom",
    "primary": "#3C87C4",
    "background": "#172B4D",
    "darkPalette": False,
}


def set_catarbi_theme(apps, schema_editor):
    Profile = apps.get_model("db", "Profile")
    Profile.objects.all().update(theme=CATARBI_THEME)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0122_alter_draftissue_assignees_alter_issue_assignees_and_more"),
    ]

    operations = [
        migrations.RunPython(set_catarbi_theme, noop),
    ]
