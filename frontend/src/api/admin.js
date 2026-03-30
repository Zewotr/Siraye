import api from "./client";

export async function getAdminUsers(params = {}) {
  const { data } = await api.get("/admin/users", { params });
  return data;
}

export async function updateAdminUser(id, payload) {
  const { data } = await api.put(`/admin/users/${id}`, payload);
  return data;
}

export async function banUser(id) {
  const { data } = await api.patch(`/admin/users/${id}/ban`);
  return data;
}

export async function unbanUser(id) {
  const { data } = await api.patch(`/admin/users/${id}/unban`);
  return data;
}

export async function deleteUser(id) {
  await api.delete(`/admin/users/${id}`);
}

export async function getSecurityLogs() {
  const { data } = await api.get("/admin/security-logs");
  return data;
}

export async function getSystemStats() {
  const { data } = await api.get("/admin/system-stats");
  return data;
}

export async function getStorageStats() {
  const { data } = await api.get("/admin/storage");
  return data;
}

export async function getBackups() {
  const { data } = await api.get("/admin/backups");
  return data;
}

export async function runBackup() {
  const { data } = await api.post("/admin/backups");
  return data;
}
