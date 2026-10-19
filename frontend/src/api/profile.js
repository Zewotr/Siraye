import api from "./client";

export async function getProfile() {
  const { data } = await api.get("/profile");
  return data;
}

export async function updateProfile(payload) {
  const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
  const config = isFormData
    ? {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    : {};
  const { data } = await api.put("/profile", payload, config);
  return data;
}

export async function changePassword(payload) {
  const { data } = await api.post("/profile/change-password", payload);
  return data;
}

export async function deleteProfile() {
  await api.delete("/profile");
}

