import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { banUser, deleteUser, getAdminUsers, unbanUser } from "../../api/admin";
import LoadingSpinner from "../../components/LoadingSpinner";
import { formatDate } from "../../utils/format";

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: getAdminUsers });

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const banMutation = useMutation({ mutationFn: banUser, onSuccess: refreshUsers });
  const unbanMutation = useMutation({ mutationFn: unbanUser, onSuccess: refreshUsers });
  const deleteMutation = useMutation({ mutationFn: deleteUser, onSuccess: refreshUsers });

  if (isLoading) return <LoadingSpinner label="Loading users" />;

  const users = data?.results || data || [];
  const totalUsers = typeof data?.count === "number" ? data.count : users.length;

  return (
    <div className="space-y-4">
      <article className="rounded-2xl bg-white p-4 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total users</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{totalUsers}</p>
      </article>

      <article className="overflow-x-auto rounded-2xl bg-white p-4 shadow-soft">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
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
