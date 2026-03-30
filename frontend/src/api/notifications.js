import api from "./client";

export async function getNotifications() {
  const { data } = await api.get("/notifications");
  return data;
}

export async function markNotificationRead(id, payload) {
  const { data } = await api.patch(`/notifications/${id}`, payload);
  return data;
}

export async function markAllRead() {
  const { data } = await api.patch("/notifications/mark-all-read");
  return data;
}
