import api from "./client";

export async function getProjects(params = {}) {
  const { data } = await api.get("/projects", { params: { page_size: 100, ...params } });
  return data;
}

export async function getProject(id) {
  const { data } = await api.get(`/projects/${id}`);
  return data;
}

export async function createProject(payload) {
  const { data } = await api.post("/projects", payload);
  return data;
}

export async function getProjectMembers(id) {
  const { data } = await api.get(`/projects/${id}/members`);
  return data;
}

export async function getLabels(workspace) {
  const { data } = await api.get("/labels", { params: { workspace, page_size: 100 } });
  return data;
}
