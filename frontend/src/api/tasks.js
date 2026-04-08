import api from "./client";

export async function getTasks(params = {}) {
  const { data } = await api.get("/tasks", { params });
  return data;
}

export async function getTask(id) {
  const { data } = await api.get(`/tasks/${id}`);
  return data;
}

export async function createTask(payload) {
  const { data } = await api.post("/tasks", payload);
  return data;
}

export async function updateTask(id, payload) {
  const { data } = await api.put(`/tasks/${id}`, payload);
  return data;
}

export async function deleteTask(id) {
  await api.delete(`/tasks/${id}`);
}

export async function completeTask(id) {
  const { data } = await api.patch(`/tasks/${id}/complete`);
  return data;
}

export async function getNextUpcomingTask() {
  const { data } = await api.get("/tasks/next-upcoming");
  return data?.task || data;
}
