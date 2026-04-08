import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { banUser, createAdminUser, deleteUser, getAdminUsers, unbanUser } from "../../api/admin";
import LoadingSpinner from "../../components/LoadingSpinner";
import { formatDate } from "../../utils/format";

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: getAdminUsers });
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    access_level: "admin",
  });
  const [createMessage, setCreateMessage] = useState("");
  const [createMessageType, setCreateMessageType] = useState("success");

  function parseCreateError(error) {
    const payload = error.response?.data;
    if (typeof payload?.detail === "string") return payload.detail;
    if (payload && typeof payload === "object") {
      const firstValue = Object.values(payload)[0];
      if (Array.isArray(firstValue) && firstValue.length > 0) return String(firstValue[0]);
      if (typeof firstValue === "string") return firstValue;
    }
    return "Failed to create admin.";
  }

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onMutate: () => setCreateMessage(""),
    onSuccess: () => {
      setNewAdmin({
        name: "",
        email: "",
        password: "",
        access_level: "admin",
      });
      setCreateMessageType("success");
      setCreateMessage("New admin created successfully.");
      refreshUsers();
    },
    onError: (error) => {
      setCreateMessageType("error");
      setCreateMessage(parseCreateError(error));
    },
  });
  const banMutation = useMutation({ mutationFn: banUser, onSuccess: refreshUsers });
  const unbanMutation = useMutation({ mutationFn: unbanUser, onSuccess: refreshUsers });
  const deleteMutation = useMutation({ mutationFn: deleteUser, onSuccess: refreshUsers });

  if (isLoading) return <LoadingSpinner label="Loading users" />;

  const users = data?.results || data || [];
  const totalUsers = typeof data?.count === "number" ? data.count : users.length;

  function handleCreateChange(event) {
    setNewAdmin((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleCreateAdmin(event) {
    event.preventDefault();
    createMutation.mutate({
      name: newAdmin.name.trim(),
      email: newAdmin.email.trim(),
      password: newAdmin.password || undefined,
      access_level: newAdmin.access_level,
    });
  }

  return (
    <div className="space-y-4">
      <article className="rounded-2xl bg-white p-4 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total users</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{totalUsers}</p>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-soft">
        <h2 className="font-heading text-xl text-slate-900">Create admin</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleCreateAdmin}>
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            name="name"
            onChange={handleCreateChange}
            placeholder="Full name"
            required
            value={newAdmin.name}
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            name="email"
            onChange={handleCreateChange}
            placeholder="admin@example.com"
            required
            type="email"
            value={newAdmin.email}
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            name="password"
            onChange={handleCreateChange}
            placeholder="Optional password"
            type="password"
            value={newAdmin.password}
          />
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            name="access_level"
            onChange={handleCreateChange}
            value={newAdmin.access_level}
          >
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2 md:w-fit"
            disabled={createMutation.isPending}
            type="submit"
          >
            {createMutation.isPending ? "Creating..." : "Create Admin"}
          </button>
        </form>
        {createMessage ? (
          <p className={`mt-3 text-sm ${createMessageType === "error" ? "text-rose-700" : "text-brand-700"}`}>
            {createMessage}
          </p>
        ) : null}
      </article>

      <article className="overflow-x-auto rounded-2xl bg-white p-4 shadow-soft">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Access</th>
              <th className="px-3 py-2">Password</th>
              <th className="px-3 py-2">Join Date</th>
              <th className="px-3 py-2">Task Count</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-b border-slate-100" key={user.id}>
                <td className="px-3 py-3 font-semibold text-slate-900">{user.name}</td>
                <td className="px-3 py-3 text-slate-700">{user.email}</td>
                <td className="px-3 py-3 text-slate-700">
                  {user.role === "admin" ? (user.access_level === "super_admin" ? "Super Admin" : "Admin") : "-"}
                </td>
                <td className="px-3 py-3 text-slate-700">{user.has_usable_password ? "Set" : "Not set"}</td>
                <td className="px-3 py-3 text-slate-700">{formatDate(user.created_at)}</td>
                <td className="px-3 py-3 text-slate-700">{user.task_count}</td>
                <td className="px-3 py-3 text-slate-700">{user.is_banned ? "Banned" : "Active"}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    {user.is_banned ? (
                      <button
                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                        onClick={() => unbanMutation.mutate(user.id)}
                        type="button"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white"
                        onClick={() => banMutation.mutate(user.id)}
                        type="button"
                      >
                        Ban
                      </button>
                    )}
                    <button
                      className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                      onClick={() => deleteMutation.mutate(user.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
