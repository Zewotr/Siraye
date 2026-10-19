from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "profile_picture",
            "role",
            "job_type",
            "theme_preference",
            "accent_color",
            "onboarding_completed",
            "is_active",
            "is_banned",
            "created_at",
            "last_login",
        ]
        read_only_fields = [
            "id",
            "role",
            "is_active",
            "is_banned",
            "created_at",
            "last_login",
        ]


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)


class EmailAuthSerializer(serializers.Serializer):
    """Login with name or email + password."""
    email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        identifier = attrs.get("username") or attrs.get("email")
        if not identifier or not str(identifier).strip():
            raise serializers.ValidationError({"email": "Please enter your name or email address."})
        attrs["identifier"] = str(identifier).strip()
        return attrs


class RegisterSerializer(serializers.Serializer):
    """Sign up with name + email + password."""
    name = serializers.CharField(required=True, max_length=255)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, min_length=8)
    password_confirm = serializers.CharField(required=True, write_only=True)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        try:
            validate_password(attrs["password"])
        except Exception as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class ProfileUpdateSerializer(serializers.ModelSerializer):
    profile_image_file = serializers.ImageField(required=False, write_only=True)
    remove_picture = serializers.BooleanField(required=False, write_only=True, default=False)
    email = serializers.EmailField(required=False)

    class Meta:
        model = User
        fields = [
            "name",
            "email",
            "job_type",
            "theme_preference",
            "accent_color",
            "onboarding_completed",
            "profile_picture",
            "profile_image_file",
            "remove_picture",
        ]

    def validate_email(self, value):
        value = value.lower().strip()
        if value and self.instance:
            if User.objects.filter(email=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("An account with this email already exists.")
        return value

    def update(self, instance, validated_data):
        remove_picture = validated_data.pop("remove_picture", False)
        if remove_picture:
            instance.profile_picture = None

        uploaded_file = validated_data.pop("profile_image_file", None)
        if uploaded_file:
            from .services import upload_profile_picture

            profile_url = upload_profile_picture(instance.id, uploaded_file)
            validated_data["profile_picture"] = profile_url

        return super().update(instance, validated_data)


class OnboardingSerializer(serializers.Serializer):
    job_type = serializers.CharField(required=True, max_length=100)
    accent_color = serializers.CharField(required=False, default="#255A54", max_length=20)
    theme_preference = serializers.CharField(required=False, default="system", max_length=20)
    primary_goal = serializers.CharField(required=False, allow_blank=True, max_length=200)

