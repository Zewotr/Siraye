import api from "./client";

export async function getWorkspaces() {
  const { data } = await api.get("/workspaces", { params: { page_size: 100 } });
  return data;
}

export async function createWorkspace(payload) {
  const { data } = await api.post("/workspaces", payload);
  return data;
}

export async function getWorkspaceMembers(id) {
  const { data } = await api.get(`/workspaces/${id}/members`);
  return data;
}

export async function updateWorkspace(id, payload) {
  const { data } = await api.patch(`/workspaces/${id}`, payload);
  return data;
}

export async function deleteWorkspace(id) {
  await api.delete(`/workspaces/${id}`);
}

