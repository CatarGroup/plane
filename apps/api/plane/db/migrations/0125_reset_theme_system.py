# Grupo Romboc / Catar BI — overlay
#
# "Custom theme" salia marcado como predeterminado en el desplegable de
# Ajustes porque la migracion 0123 forzaba theme="custom" en TODOS los
# perfiles. Ruben quiere que el valor por defecto sea "System Preference".
#
# El valor "system" se guarda como dict vacio ({}), que es el default del
# campo JSONField en el modelo Profile, y es lo que el frontend interpreta
# como "System Preference".
#
# No toca el look visual: theme.css sigue aplicandose igual.

from django.db import migrations


def reset_theme_to_system(apps, schema_editor):
    Profile = apps.get_model("db", "Profile")
    Profile.objects.all().update(theme={})


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0124_issuetimelog"),
    ]

    operations = [
        migrations.RunPython(reset_theme_to_system, noop),
    ]
