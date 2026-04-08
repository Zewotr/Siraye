import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { deleteProfile, getProfile, updateProfile } from "../../api/profile";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../utils/format";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, refreshUser, user } = useAuth();
  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: getProfile,
  });
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    if (data?.name) {
      setName(data.name);
    }
  }, [data?.name]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onMutate: () => setMessage(""),
    onSuccess: async () => {
      await refetch();
      await refreshUser();
      setImageFile(null);
      setMessageType("success");
      setMessage("Profile updated successfully.");
    },
    onError: (updateError) => {
      setMessageType("error");
      setMessage(updateError.response?.data?.detail || "Failed to update profile.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: async () => {
      await logout();
      navigate("/login");
    },
    onError: (deleteError) => {
      setMessageType("error");
      setMessage(deleteError.response?.data?.detail || "Failed to delete account.");
    },
  });

  if (isLoading) return <LoadingSpinner label="Loading profile" />;
  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <p className="text-sm text-rose-700">{error?.response?.data?.detail || "Failed to load profile."}</p>
      </div>
    );
  }

  async function handleUpdate(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName === data.name && !imageFile) {
      setMessageType("info");
      setMessage("No changes to update.");
      return;
    }
    const payload = new FormData();
    payload.append("name", trimmedName || data.name);
    if (imageFile) {
      payload.append("profile_image_file", imageFile);
    }
    updateMutation.mutate(payload);
  }

  function handleDeleteAccount() {
    const confirmed = window.confirm("Are you sure to delete your account? This action cannot be undone.");
    if (!confirmed) return;
    deleteMutation.mutate();
  }

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-3xl text-slate-900">Profile</h1>
      <article className="rounded-2xl bg-white p-6 shadow-soft">
        <div className="flex items-center gap-4">
          <img
            alt={data.name}
            className="h-16 w-16 rounded-full object-cover"
            src={data.profile_picture || "https://placehold.co/120x120?text=User"}
          />
          <div>
            <h2 className="font-heading text-2xl text-slate-900">{data.name}</h2>
            <p className="text-sm text-slate-600">{data.email}</p>
            <p className="text-xs text-slate-500">Joined {formatDate(data.created_at)}</p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleUpdate}>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="name">
              Name
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              id="name"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="profile_image_file">
              Profile picture
            </label>
            <input
              accept="image/*"
              id="profile_image_file"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              type="file"
            />
          </div>

          <button
            className="rounded-full bg-brand-700 px-5 py-2 font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={updateMutation.isPending}
            type="submit"
          >
            {updateMutation.isPending ? "Updating..." : "Update profile"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <button
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deleteMutation.isPending}
            onClick={handleDeleteAccount}
            type="button"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete account"}
          </button>
        </div>

        {message ? (
          <p
            aria-live="polite"
            className={`mt-4 text-sm ${
              messageType === "error"
                ? "text-rose-700"
                : messageType === "info"
                  ? "text-slate-600"
                  : "text-brand-700"
            }`}
          >
            {message}
          </p>
        ) : null}
      </article>
    </div>
  );
}
