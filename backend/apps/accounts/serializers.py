from rest_framework import serializers

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
    email = serializers.EmailField(required=True)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class ProfileUpdateSerializer(serializers.ModelSerializer):
    profile_image_file = serializers.ImageField(required=False, write_only=True)

    class Meta:
        model = User
        fields = ["name", "profile_picture", "profile_image_file"]

    def update(self, instance, validated_data):
        uploaded_file = validated_data.pop("profile_image_file", None)
        if uploaded_file:
            from .services import upload_profile_picture

            profile_url = upload_profile_picture(instance.id, uploaded_file)
            validated_data["profile_picture"] = profile_url
        return super().update(instance, validated_data)
