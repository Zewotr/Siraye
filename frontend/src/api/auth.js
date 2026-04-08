import api from "./client";

export async function loginWithGoogle(idToken) {
  const { data } = await api.post("/auth/google", { id_token: idToken });
  return data;
}

export async function loginWithEmail(email) {
  const { data } = await api.post("/auth/email-login", { email });
  return data;
}

export async function logout(refreshToken) {
  await api.post("/auth/logout", { refresh: refreshToken });
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}
