import api from "./client";

export async function loginWithGoogle(idToken) {
  const { data } = await api.post("/auth/google", { id_token: idToken });
  return data;
}

export async function loginWithCredentials(identifier, password) {
  const { data } = await api.post("/auth/login", {
    username: identifier,
    email: identifier,
    password,
  });
  return data;
}

export async function registerWithCredentials(name, email, password, passwordConfirm) {
  const { data } = await api.post("/auth/register", {
    name,
    email,
    password,
    password_confirm: passwordConfirm,
  });
  return data;
}

export async function logout(refreshToken) {
  await api.post("/auth/logout", { refresh: refreshToken });
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function submitOnboarding(payload) {
  const { data } = await api.post("/accounts/onboarding", payload);
  return data;
}

