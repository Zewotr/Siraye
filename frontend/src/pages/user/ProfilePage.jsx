import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { changePassword, deleteProfile, getProfile, updateProfile } from "../../api/profile";
import { createWorkspace, deleteWorkspace, getWorkspaces, updateWorkspace } from "../../api/workspaces";
import Icon from "../../components/Icon";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspace } from "../../hooks/useWorkspace";
import { formatDate, formatDateTime } from "../../utils/format";
import { applyThemeColor, PRESET_COLORS } from "../../utils/theme";

const WORKSPACE_COLORS = [
  "#635BFF", // Indigo
  "#0EA5E9", // Sky
  "#10B981", // Emerald
  "#255A54", // Deep Pine
  "#F59E0B", // Amber
  "#EF4444", // Rose
  "#8B5CF6", // Purple
  "#EC4899", // Pink
];

const WORKSPACE_ICONS = [
  { id: "sparkles", label: "Sparkles" },
  { id: "folder", label: "Folder" },
  { id: "layers", label: "Layers" },
  { id: "grid", label: "Grid" },
  { id: "target", label: "Target" },
  { id: "zap", label: "Zap" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout, refreshUser, user } = useAuth();
  const { activeWorkspace, setActiveWorkspace } = useWorkspace();

  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("profile"); // profile | security | workspaces | preferences | danger

  // Profile Query
  const {
    data: profile,
    error: profileError,
    isError: isProfileError,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: getProfile,
  });

  // Workspaces Query
  const {
    data: workspacesData,
    isLoading: isWorkspacesLoading,
    refetch: refetchWorkspaces,
  } = useQuery({
    queryKey: ["workspaces", user?.id],
    queryFn: getWorkspaces,
    enabled: Boolean(user?.id),
  });

  const workspaces = useMemo(() => {
    return workspacesData?.results || workspacesData || [];
  }, [workspacesData]);

  // Alert State
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error' | 'info', message: string }

  // Profile Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [accentColor, setAccentColor] = useState(
    () => user?.accent_color || localStorage.getItem("siraye:color") || "#255A54"
  );

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
      setImagePreview(profile.profile_picture || null);
      if (profile.accent_color) {
        setAccentColor(profile.accent_color);
        applyThemeColor(profile.accent_color);
      }
    }
  }, [profile]);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Workspace Create / Edit Modal State
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null); // null for create, object for edit
  const [wsName, setWsName] = useState("");
  const [wsColor, setWsColor] = useState(WORKSPACE_COLORS[0]);
  const [wsIcon, setWsIcon] = useState("sparkles");
  const [wsDescription, setWsDescription] = useState("");

  // Delete Modals
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteWsTarget, setDeleteWsTarget] = useState(null);

  // App Preferences State (Stored in localStorage)
  const [themePreference, setThemePreference] = useState(() => localStorage.getItem("siraye:theme") || "system");
  const [focusLength, setFocusLength] = useState(() => localStorage.getItem("siraye:pref_focus") || "25");
  const [breakLength, setBreakLength] = useState(() => localStorage.getItem("siraye:pref_break") || "5");
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("siraye:pref_sound") !== "false");
  const [weekStart, setWeekStart] = useState(() => localStorage.getItem("siraye:pref_weekstart") || "monday");

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onMutate: () => setAlert(null),
    onSuccess: async (updated) => {
      await refetchProfile();
      await refreshUser();
      setImageFile(null);
      setImagePreview(updated.profile_picture || null);
      setAlert({ type: "success", message: "Profile updated successfully." });
    },
    onError: (err) => {
      setAlert({
        type: "error",
        message: err.response?.data?.email?.[0] || err.response?.data?.detail || "Failed to update profile.",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onMutate: () => setAlert(null),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAlert({ type: "success", message: "Password updated successfully." });
    },
    onError: (err) => {
      setAlert({
        type: "error",
        message: err.response?.data?.detail || "Failed to update password.",
      });
    },
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: async (created) => {
      await refetchWorkspaces();
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setActiveWorkspace(created);
      setWorkspaceModalOpen(false);
      resetWorkspaceForm();
      setAlert({ type: "success", message: `Workspace "${created.name}" created successfully.` });
    },
    onError: (err) => {
      setAlert({
        type: "error",
        message: err.response?.data?.name?.[0] || err.response?.data?.detail || "Failed to create workspace.",
      });
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: ({ id, payload }) => updateWorkspace(id, payload),
    onSuccess: async (updated) => {
      await refetchWorkspaces();
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      if (activeWorkspace?.id === updated.id) {
        setActiveWorkspace(updated);
      }
      setWorkspaceModalOpen(false);
      resetWorkspaceForm();
      setAlert({ type: "success", message: `Workspace "${updated.name}" updated successfully.` });
    },
    onError: (err) => {
      setAlert({
        type: "error",
        message: err.response?.data?.name?.[0] || err.response?.data?.detail || "Failed to update workspace.",
      });
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (id) => deleteWorkspace(id),
    onSuccess: async () => {
      await refetchWorkspaces();
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setDeleteWsTarget(null);
      setAlert({ type: "success", message: "Workspace deleted successfully." });
    },
    onError: (err) => {
      setAlert({
        type: "error",
        message: err.response?.data?.detail || "Failed to delete workspace.",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: async () => {
      await logout();
      navigate("/login");
    },
    onError: (err) => {
      setAlert({
        type: "error",
        message: err.response?.data?.detail || "Failed to delete account.",
      });
    },
  });

  // Image Selection Handler
  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setAlert({ type: "error", message: "Image must be smaller than 5MB." });
        return;
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  }

  function handleRemovePicture() {
    setImageFile(null);
    setImagePreview(null);
    const payload = new FormData();
    payload.append("remove_picture", "true");
    payload.append("name", name.trim() || profile?.name || "User");
    updateProfileMutation.mutate(payload);
  }

  // Profile Save
  function handleProfileSubmit(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setAlert({ type: "error", message: "Name cannot be empty." });
      return;
    }

    const payload = new FormData();
    payload.append("name", trimmedName);
    payload.append("accent_color", accentColor);
    if (trimmedEmail && trimmedEmail !== profile?.email) {
      payload.append("email", trimmedEmail);
    }
    if (imageFile) {
      payload.append("profile_image_file", imageFile);
    }

    updateProfileMutation.mutate(payload);
  }

  // Live Color Selection & Persistence
  function handleColorSelect(colorId) {
    setAccentColor(colorId);
    applyThemeColor(colorId);
    localStorage.setItem("siraye:color", colorId);

    const colorName = PRESET_COLORS.find((c) => c.id.toUpperCase() === colorId.toUpperCase())?.name || colorId;

    // Save to user profile on backend
    updateProfileMutation.mutate(
      { accent_color: colorId },
      {
        onSuccess: async () => {
          // Keep active workspace color synced if available
          if (activeWorkspace?.id) {
            updateWorkspaceMutation.mutate({
              id: activeWorkspace.id,
              payload: {
                name: activeWorkspace.name,
                color: colorId,
                icon: activeWorkspace.icon || "sparkles",
              },
            });
          }
          setAlert({ type: "success", message: `Accent color updated to ${colorName}.` });
        },
      }
    );
  }

  // Password Submit
  function handlePasswordSubmit(event) {
    event.preventDefault();
    if (!currentPassword) {
      setAlert({ type: "error", message: "Please enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setAlert({ type: "error", message: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlert({ type: "error", message: "New passwords do not match." });
      return;
    }
    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  }

  // Workspace Modal Handlers
  function resetWorkspaceForm() {
    setEditingWorkspace(null);
    setWsName("");
    setWsColor(WORKSPACE_COLORS[0]);
    setWsIcon("sparkles");
    setWsDescription("");
  }

  function openCreateWorkspace() {
    resetWorkspaceForm();
    setWorkspaceModalOpen(true);
  }

  function openEditWorkspace(ws) {
    setEditingWorkspace(ws);
    setWsName(ws.name);
    setWsColor(ws.color || WORKSPACE_COLORS[0]);
    setWsIcon(ws.icon || "sparkles");
    setWsDescription(ws.description || "");
    setWorkspaceModalOpen(true);
  }

  function handleWorkspaceSubmit(event) {
    event.preventDefault();
    const trimmedName = wsName.trim();
    if (!trimmedName) {
      setAlert({ type: "error", message: "Workspace name is required." });
      return;
    }

    const payload = {
      name: trimmedName,
      color: wsColor,
      icon: wsIcon,
      description: wsDescription.trim(),
    };

    if (editingWorkspace) {
      updateWorkspaceMutation.mutate({ id: editingWorkspace.id, payload });
    } else {
      createWorkspaceMutation.mutate(payload);
    }
  }

  // Preferences Save
  function savePreference(key, value) {
    localStorage.setItem(key, value);
    if (key === "siraye:theme") {
      setThemePreference(value);
      if (value === "dark") {
        document.documentElement.classList.add("dark");
      } else if (value === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", prefersDark);
      }
    } else if (key === "siraye:pref_focus") setFocusLength(value);
    else if (key === "siraye:pref_break") setBreakLength(value);
    else if (key === "siraye:pref_sound") setSoundEnabled(value === "true");
    else if (key === "siraye:pref_weekstart") setWeekStart(value);

    setAlert({ type: "success", message: "Preferences updated." });
  }

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 25;
    if (newPassword.length >= 12) score += 25;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 25;
    if (/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword)) score += 25;
    return score;
  }, [newPassword]);

  if (isProfileLoading) return <LoadingSpinner label="Loading settings" />;
  if (isProfileError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/30 dark:bg-rose-950/20">
        <div className="flex items-center gap-3 text-rose-700 dark:text-rose-400">
          <Icon name="alertTriangle" size={20} />
          <p className="font-semibold">{profileError?.response?.data?.detail || "Failed to load account profile."}</p>
        </div>
        <button
          className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
          onClick={() => refetchProfile()}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  const userInitial = (profile?.name || user?.name || "U")[0]?.toUpperCase();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your identity, security credentials, connected workspaces, and productivity preferences.
        </p>
      </div>

      {/* Hero User Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/70 to-slate-100/50 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {imagePreview ? (
                <img
                  alt={profile?.name}
                  className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white shadow-md dark:ring-slate-800"
                  src={imagePreview}
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-2xl font-black text-white shadow-md">
                  {userInitial}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change profile avatar"
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 text-white opacity-0 transition group-hover:opacity-100"
              >
                <Icon name="camera" size={20} />
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
                  {profile?.name}
                </h2>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 capitalize">
                  {profile?.role || "Member"}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>Member since {formatDate(profile?.created_at)}</span>
                <span>•</span>
                <span>{workspaces.length} Workspace{workspaces.length === 1 ? "" : "s"}</span>
                {activeWorkspace && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeWorkspace.color }} />
                      Active: {activeWorkspace.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setActiveTab("workspaces")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Icon name="layers" size={15} />
              Workspaces ({workspaces.length})
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
            >
              <Icon name="logOut" size={15} />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Alert Notification Banner */}
      {alert && (
        <div
          role="alert"
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
            alert.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
              : alert.type === "info"
              ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Icon
              name={alert.type === "error" ? "alertCircle" : alert.type === "info" ? "alertCircle" : "checkCircle"}
              size={18}
            />
            <span>{alert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlert(null)}
            className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Dismiss alert"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 scrollbar-none dark:border-slate-800">
        <div className="flex gap-1 pb-px">
          {[
            { id: "profile", label: "Profile", icon: "user" },
            { id: "security", label: "Security & Passwords", icon: "lock" },
            { id: "workspaces", label: "Workspaces", icon: "layers" },
            { id: "preferences", label: "Preferences", icon: "settings" },
            { id: "danger", label: "Danger Zone", icon: "alertTriangle" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setAlert(null);
                }}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition ${
                  isActive
                    ? "border-brand-700 text-brand-700 dark:border-brand-400 dark:text-brand-300"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200"
                }`}
                type="button"
              >
                <Icon name={tab.icon} size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: GENERAL PROFILE (Read, Update, Delete Avatar) */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
              Personal Information
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Update your photo, display name, and registered email address across Siraye.
            </p>

            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-6">
              {/* Photo Upload Zone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Profile Avatar
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="relative">
                    {imagePreview ? (
                      <img
                        alt={name || "Avatar"}
                        className="h-20 w-20 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                        src={imagePreview}
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-2xl font-bold text-white">
                        {userInitial}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <Icon name="camera" size={15} />
                      Upload photo
                    </button>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemovePicture}
                        disabled={updateProfileMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/20"
                      >
                        <Icon name="trash" size={15} />
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Supports PNG, JPG, or WEBP up to 5MB. Square aspect ratio recommended.
                </p>
              </div>

              {/* Form Inputs */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 shadow-xs transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-brand-400 dark:focus:bg-slate-900"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 shadow-xs transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-brand-400 dark:focus:bg-slate-900"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {/* Accent Color Preference in Profile Form */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Accent Color Preference
                  </label>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="h-3 w-3 rounded-full shadow-xs" style={{ backgroundColor: accentColor }} />
                    {PRESET_COLORS.find((c) => c.id.toUpperCase() === accentColor.toUpperCase())?.name || accentColor}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Colors your navigation, buttons, focus charts, and dashboard highlights.
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                  {PRESET_COLORS.map((c) => {
                    const isSelected = accentColor.toUpperCase() === c.id.toUpperCase();
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleColorSelect(c.id)}
                        className={`group flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                          isSelected
                            ? "border-slate-900 bg-slate-100/90 ring-2 ring-slate-900/10 dark:border-white dark:bg-slate-800 dark:ring-white/10"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850"
                        }`}
                      >
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white shadow-xs"
                          style={{ backgroundColor: c.id }}
                        >
                          {isSelected && <Icon name="check" size={13} strokeWidth={3} />}
                        </span>
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                            {c.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Read-Only Account Details */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/60 dark:bg-slate-800/30">
                <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                  <div>
                    <span className="block text-slate-400">Account ID</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">#{profile?.id}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Role</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{profile?.role || "Member"}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Created</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(profile?.created_at)}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Last Active</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {profile?.last_login ? formatDateTime(profile.last_login) : "Active now"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-700/20 transition hover:bg-brand-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Icon name="refreshCw" size={14} className="animate-spin" />
                      Saving changes…
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={15} />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* TAB 2: SECURITY & PASSWORDS (Update Password, View Session Info) */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                <Icon name="key" size={16} />
              </span>
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                  Change Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ensure your account is protected with a unique, long password.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Current Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pr-10 text-sm text-slate-900 shadow-xs transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <Icon name={showCurrentPass ? "eyeOff" : "eye"} size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  New Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pr-10 text-sm text-slate-900 shadow-xs transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <Icon name={showNewPass ? "eyeOff" : "eye"} size={16} />
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength <= 25
                            ? "w-1/4 bg-rose-500"
                            : passwordStrength <= 50
                            ? "w-2/4 bg-amber-500"
                            : passwordStrength <= 75
                            ? "w-3/4 bg-sky-500"
                            : "w-full bg-emerald-500"
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {passwordStrength <= 25 && "Weak password"}
                      {passwordStrength === 50 && "Fair password"}
                      {passwordStrength === 75 && "Good password"}
                      {passwordStrength === 100 && "Strong password"}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Confirm New Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pr-10 text-sm text-slate-900 shadow-xs transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <Icon name={showConfirmPass ? "eyeOff" : "eye"} size={16} />
                  </button>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-700/20 transition hover:bg-brand-800 disabled:opacity-60"
                >
                  {changePasswordMutation.isPending ? "Updating password…" : "Update password"}
                </button>
              </div>
            </form>
          </section>

          {/* Active Session & Device Card */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Icon name="shield" size={16} />
              </span>
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                  Active Session & Devices
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Current authenticated device holding an active JWT session.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-700 shadow-xs dark:bg-slate-800 dark:text-brand-300">
                    <Icon name="sidebar" size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Current Web Browser Session
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active now
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Stateless JWT with rotating refresh tokens • Authenticated as {profile?.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Log out
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: WORKSPACES (Full CRUD: List, Create, Update, Delete, Switch) */}
      {activeTab === "workspaces" && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                  Your Workspaces
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Create and manage workspaces for teams, clients, and personal projects.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateWorkspace}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-700/20 transition hover:bg-brand-800 active:scale-95"
              >
                <Icon name="plus" size={15} />
                New Workspace
              </button>
            </div>

            {isWorkspacesLoading ? (
              <div className="py-12">
                <LoadingSpinner label="Loading workspaces" />
              </div>
            ) : workspaces.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No workspaces found.</p>
                <button
                  type="button"
                  onClick={openCreateWorkspace}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-xs font-bold text-white shadow-md"
                >
                  <Icon name="plus" size={15} /> Create your first workspace
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {workspaces.map((ws) => {
                  const isActive = activeWorkspace?.id === ws.id;
                  const isOwner = ws.owner?.id === profile?.id || ws.current_role === "owner" || profile?.role === "admin";

                  return (
                    <div
                      key={ws.id}
                      className={`relative flex flex-col justify-between rounded-2xl border p-4 transition ${
                        isActive
                          ? "border-brand-500/60 bg-brand-50/20 dark:border-brand-500/40 dark:bg-brand-500/5 shadow-xs"
                          : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                              style={{ backgroundColor: ws.color || "#635BFF" }}
                            >
                              <Icon name={ws.icon || "sparkles"} size={18} />
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-white">
                                  {ws.name}
                                </h4>
                                {isActive && (
                                  <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-extrabold text-brand-800 dark:bg-brand-500/20 dark:text-brand-300">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">
                                /{ws.slug}
                              </p>
                            </div>
                          </div>

                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 capitalize">
                            {ws.current_role || (isOwner ? "Owner" : "Member")}
                          </span>
                        </div>

                        {ws.description && (
                          <p className="mt-2.5 text-xs text-slate-500 line-clamp-2 dark:text-slate-400">
                            {ws.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>{ws.member_count ?? 1} member{ws.member_count === 1 ? "" : "s"}</span>
                          <span>•</span>
                          <span>{ws.project_count ?? 0} project{ws.project_count === 1 ? "" : "s"}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveWorkspace(ws);
                                setAlert({ type: "success", message: `Switched to workspace "${ws.name}".` });
                              }}
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              Switch
                            </button>
                          )}
                          {isOwner && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditWorkspace(ws)}
                                title="Edit workspace"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                              >
                                <Icon name="edit" size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteWsTarget(ws)}
                                title="Delete workspace"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400"
                              >
                                <Icon name="trash" size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 4: PREFERENCES & PRODUCTIVITY */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
          {/* Accent Color Palette Section */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                  Brand & Accent Color
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Select your workspace accent palette. Dynamically styles navigation, focus cards, charts, and KPI badges.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                <span className="h-3 w-3 rounded-full shadow-xs" style={{ backgroundColor: accentColor }} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {PRESET_COLORS.find((c) => c.id.toUpperCase() === accentColor.toUpperCase())?.name || accentColor}
                </span>
                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  Active
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {PRESET_COLORS.map((c) => {
                const isSelected = accentColor.toUpperCase() === c.id.toUpperCase();
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleColorSelect(c.id)}
                    className={`group relative flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10 dark:border-white dark:bg-slate-800/80 dark:ring-white/10"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-850 dark:hover:border-slate-700"
                    }`}
                  >
                    <div
                      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition group-hover:scale-105"
                      style={{ backgroundColor: c.id }}
                    >
                      {isSelected && <Icon name="check" size={17} strokeWidth={3} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Saved
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">
                        {c.desc}
                      </p>
                      <span className="mt-1 block font-mono text-[10px] text-slate-400">
                        {c.id}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Interactive Preview Ribbon */}
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Live Interface Preview With Chosen Accent
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl bg-brand-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-700/25 transition hover:bg-brand-800"
                >
                  Primary Action Button
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-600 dark:bg-brand-400" />
                  Active Workspace Badge
                </span>
                <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/50 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
                  <Icon name="checkCircle" size={14} />
                  KPI Highlight
                </div>
                <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: "75%" }} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
              Display & Appearance
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Customize how Siraye looks on your device.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3 max-w-lg">
              {[
                { id: "light", label: "Light", icon: "sun" },
                { id: "dark", label: "Dark", icon: "moon" },
                { id: "system", label: "System", icon: "sidebar" },
              ].map((theme) => {
                const isSelected = themePreference === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => savePreference("siraye:theme", theme.id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 font-bold text-xs transition ${
                      isSelected
                        ? "border-brand-600 bg-brand-50/30 text-brand-700 shadow-xs dark:border-brand-500 dark:bg-brand-500/10 dark:text-brand-300"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    <Icon name={theme.icon} size={20} />
                    <span>{theme.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
              Timer & Pomotroid Defaults
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Configure default session durations for the Pomotroid focus board.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 max-w-xl">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Focus Session Duration
                </label>
                <select
                  value={focusLength}
                  onChange={(e) => savePreference("siraye:pref_focus", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="20">20 minutes</option>
                  <option value="25">25 minutes (Standard)</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="50">50 minutes (Deep Focus)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Short Break Duration
                </label>
                <select
                  value={breakLength}
                  onChange={(e) => savePreference("siraye:pref_break", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="3">3 minutes</option>
                  <option value="5">5 minutes (Standard)</option>
                  <option value="10">10 minutes</option>
                </select>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => savePreference("siraye:pref_sound", String(e.target.checked))}
                  className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    Sound Effects & Chimes
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Play harmonic audio chimes when focus periods and breaks complete.
                  </span>
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
              Weekly Planner Configuration
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Customize week cycle and coordination rules.
            </p>

            <div className="mt-4 max-w-sm">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Week Starts On
              </label>
              <select
                value={weekStart}
                onChange={(e) => savePreference("siraye:pref_weekstart", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="monday">Monday (Siraye default)</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
          </section>
        </div>
      )}

      {/* TAB 5: DANGER ZONE (Delete Account) */}
      {activeTab === "danger" && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-rose-200 bg-rose-50/40 p-7 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20">
            <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400">
              <Icon name="alertTriangle" size={20} />
              <h3 className="font-heading text-lg font-bold">
                Delete Account
              </h3>
            </div>
            <p className="mt-2 text-xs text-rose-600/90 dark:text-rose-300/80 leading-relaxed max-w-2xl">
              Permanently delete your Siraye account, all personal tasks, weekly schedules, focus timer history, and owned workspaces. Once deleted, this action cannot be recovered.
            </p>

            <div className="mt-6 border-t border-rose-200/60 pt-5 dark:border-rose-900/40">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmationText("");
                  setDeleteAccountModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700 active:scale-95"
              >
                <Icon name="trash" size={15} />
                Permanently delete account
              </button>
            </div>
          </section>
        </div>
      )}

      {/* WORKSPACE CREATE / EDIT MODAL */}
      {workspaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                {editingWorkspace ? "Edit Workspace" : "Create New Workspace"}
              </h3>
              <button
                type="button"
                onClick={() => setWorkspaceModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleWorkspaceSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Workspace Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="e.g. Acme Corp or Personal"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-xs focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Color Swatches */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Color Theme
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WORKSPACE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setWsColor(color)}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        wsColor === color ? "scale-110 ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Icon
                </label>
                <div className="mt-2 flex gap-2">
                  {WORKSPACE_ICONS.map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => setWsIcon(icon.id)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                        wsIcon === icon.id
                          ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/20 dark:text-brand-300"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon name={icon.id} size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={wsDescription}
                  onChange={(e) => setWsDescription(e.target.value)}
                  placeholder="Short purpose or team summary"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 shadow-xs focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setWorkspaceModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createWorkspaceMutation.isPending || updateWorkspaceMutation.isPending}
                  className="rounded-xl bg-brand-700 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-brand-800 disabled:opacity-60"
                >
                  {createWorkspaceMutation.isPending || updateWorkspaceMutation.isPending
                    ? "Saving…"
                    : editingWorkspace
                    ? "Update Workspace"
                    : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE WORKSPACE CONFIRMATION MODAL */}
      {deleteWsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <Icon name="alertTriangle" size={20} />
              <h3 className="font-heading text-lg font-bold">Delete Workspace</h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete workspace <strong className="text-slate-900 dark:text-white">"{deleteWsTarget.name}"</strong>? All projects and tasks contained within will be permanently removed.
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteWsTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteWorkspaceMutation.isPending}
                onClick={() => deleteWorkspaceMutation.mutate(deleteWsTarget.id)}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-rose-700 disabled:opacity-60"
              >
                {deleteWorkspaceMutation.isPending ? "Deleting…" : "Delete Workspace"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {deleteAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900/50 dark:bg-slate-900">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <Icon name="alertTriangle" size={20} />
              <h3 className="font-heading text-lg font-bold">Delete Account Permanently</h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This action cannot be undone. To confirm deletion, please type <strong className="text-rose-600 dark:text-rose-400">DELETE</strong> below.
            </p>

            <div className="mt-4">
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 shadow-xs focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteAccountModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText.trim() !== "DELETE" || deleteAccountMutation.isPending}
                onClick={() => deleteAccountMutation.mutate()}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteAccountMutation.isPending ? "Deleting account…" : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
