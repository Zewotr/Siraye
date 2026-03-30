# Generated manually for project bootstrap.

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="BackupRecord",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("file_name", models.CharField(max_length=255)),
                ("bucket_path", models.CharField(blank=True, max_length=500)),
                ("public_url", models.URLField(blank=True, max_length=1000)),
                ("size_bytes", models.BigIntegerField(default=0)),
                (
                    "status",
                    models.CharField(choices=[("success", "Success"), ("failed", "Failed")], max_length=20),
                ),
                ("error_message", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="SystemMetric",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("captured_at", models.DateTimeField(auto_now_add=True)),
                ("total_users", models.PositiveIntegerField(default=0)),
                ("active_users", models.PositiveIntegerField(default=0)),
                ("tasks_created", models.PositiveIntegerField(default=0)),
                ("tasks_completed_today", models.PositiveIntegerField(default=0)),
                ("system_storage_usage_bytes", models.BigIntegerField(default=0)),
                ("uploaded_files", models.PositiveIntegerField(default=0)),
            ],
            options={"ordering": ["-captured_at"]},
        ),
        migrations.CreateModel(
            name="SecurityLog",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                (
                    "event_type",
                    models.CharField(
                        choices=[
                            ("failed_login", "Failed Login"),
                            ("rate_limit", "Rate Limit Exceeded"),
                            ("unauthorized", "Unauthorized Access"),
                            ("forbidden", "Forbidden Access"),
                            ("suspicious", "Suspicious Activity"),
                        ],
                        max_length=30,
                    ),
                ),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.TextField(blank=True)),
                ("path", models.CharField(blank=True, max_length=255)),
                ("method", models.CharField(blank=True, max_length=10)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="security_logs",
                        to="accounts.user",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="FileAsset",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("bucket", models.CharField(max_length=100)),
                ("path", models.CharField(max_length=500)),
                ("public_url", models.URLField(max_length=1000)),
                ("size_bytes", models.BigIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="file_assets",
                        to="accounts.user",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="AdminLog",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("action", models.CharField(max_length=100)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "admin",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="admin_logs",
                        to="accounts.user",
                    ),
                ),
                (
                    "target_user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="targeted_admin_logs",
                        to="accounts.user",
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name="securitylog",
            index=models.Index(fields=["event_type", "created_at"], name="monitoring__event_t_760d4a_idx"),
        ),
        migrations.AddIndex(
            model_name="securitylog",
            index=models.Index(fields=["user", "created_at"], name="monitoring__user_id_305294_idx"),
        ),
        migrations.AddIndex(
            model_name="adminlog",
            index=models.Index(fields=["created_at"], name="monitoring__created_d17efc_idx"),
        ),
        migrations.AddIndex(
            model_name="fileasset",
            index=models.Index(fields=["user", "created_at"], name="monitoring__user_id_8d7f6f_idx"),
        ),
        migrations.AddIndex(
            model_name="fileasset",
            index=models.Index(fields=["bucket"], name="monitoring__bucket_e4db85_idx"),
        ),
    ]
