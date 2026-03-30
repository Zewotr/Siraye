import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { resendVerification } from "../../api/auth";
import { deleteProfile, getProfile, updateProfile } from "../../api/profile";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../utils/format";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, refreshUser } = useAuth();
  const { data, isLoading, refetch } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await refetch();
      await refreshUser();
      setMessage("Profile updated.");
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: (response) => setMessage(response.detail || "Verification email sent."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: async () => {
      await logout();
      navigate("/login");
    },
  });

  if (isLoading) return <LoadingSpinner label="Loading profile" />;

  async function handleUpdate(event) {
    event.preventDefault();
    const payload = new FormData();
    payload.append("name", name || data.name);
    if (imageFile) {
      payload.append("profile_image_file", imageFile);
    }
    updateMutation.mutate(payload);
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
              defaultValue={data.name}
              id="name"
              onChange={(event) => setName(event.target.value)}
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

          <button className="rounded-full bg-brand-700 px-5 py-2 font-semibold text-white" type="submit">
            Save profile
          </button>
        </form>

        {!data.email_verified ? (
          <div className="mt-5 rounded-xl bg-amber-50 p-4">
            <p className="text-sm text-amber-800">Email not verified yet. Verify to unlock all features.</p>
            <button
              className="mt-2 rounded-full bg-amber-500 px-3 py-1 text-sm font-semibold text-white"
              onClick={() => resendMutation.mutate()}
              type="button"
            >
              Resend verification email
            </button>
          </div>
        ) : null}

        <div className="mt-6 border-t border-slate-100 pt-4">
          <button
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => deleteMutation.mutate()}
            type="button"
          >
            Delete account
          </button>
        </div>

        {message ? <p className="mt-4 text-sm text-brand-700">{message}</p> : null}
      </article>
    </div>
  );
}
