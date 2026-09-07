# Generated for P0-02: Lead hardening
import uuid

from django.db import migrations, models


def backfill_idempotency(apps, schema_editor):
    Lead = apps.get_model("leads", "Lead")
    for lead in Lead.objects.filter(idempotency_key__isnull=True):
        lead.idempotency_key = uuid.uuid4().hex
        lead.save(update_fields=["idempotency_key"])
    for lead in Lead.objects.filter(idempotency_key=""):
        lead.idempotency_key = uuid.uuid4().hex
        lead.save(update_fields=["idempotency_key"])


class Migration(migrations.Migration):

    dependencies = [("leads", "0001_initial")]

    operations = [
        migrations.AddField(model_name="lead", name="phone", field=models.CharField(blank=True, default="", max_length=32)),
        migrations.AddField(model_name="lead", name="locale", field=models.CharField(default="vi", max_length=5)),
        migrations.AddField(model_name="lead", name="consent", field=models.BooleanField(default=False)),
        migrations.AddField(model_name="lead", name="source_url", field=models.URLField(blank=True, default="", max_length=500)),
        migrations.AddField(model_name="lead", name="utm_source", field=models.CharField(blank=True, default="", max_length=120)),
        migrations.AddField(model_name="lead", name="utm_medium", field=models.CharField(blank=True, default="", max_length=120)),
        migrations.AddField(model_name="lead", name="utm_campaign", field=models.CharField(blank=True, default="", max_length=200)),
        migrations.AddField(model_name="lead", name="status", field=models.CharField(choices=[("new", "New"), ("contacted", "Contacted"), ("qualified", "Qualified"), ("won", "Won"), ("lost", "Lost"), ("spam", "Spam")], default="new", max_length=16)),
        migrations.AddField(model_name="lead", name="idempotency_key", field=models.CharField(blank=True, default="", max_length=64)),
        migrations.RunPython(backfill_idempotency, migrations.RunPython.noop),
        migrations.AlterField(model_name="lead", name="idempotency_key", field=models.CharField(max_length=64, unique=True)),
        migrations.AddIndex(model_name="lead", index=models.Index(fields=["status", "created_at"], name="leads_lead_status_8a7a_idx")),
    ]
