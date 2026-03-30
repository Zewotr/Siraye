import uuid
from datetime import timedelta

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        USER = "user", "User"
        ADMIN = "admin", "Admin"

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    profile_picture = models.URLField(blank=True, null=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_banned = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(blank=True, null=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = ["name"]

    objects = UserManager()

    def __str__(self):
        return self.email


class EmailVerification(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="email_verifications",
    )
    verification_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    verification_expiry = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["verification_token"]),
            models.Index(fields=["user", "is_used"]),
        ]

    def mark_used(self):
        self.is_used = True
        self.save(update_fields=["is_used"])

    @classmethod
    def create_for_user(cls, user, expiry_hours: int = 24):
        return cls.objects.create(
            user=user,
            verification_expiry=timezone.now() + timedelta(hours=expiry_hours),
        )

    @property
    def is_expired(self):
        return timezone.now() > self.verification_expiry

    def __str__(self):
        return f"EmailVerification(user={self.user_id}, used={self.is_used})"
