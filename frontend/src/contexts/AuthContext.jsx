import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  fetchCurrentUser,
  loginWithCredentials,
  loginWithGoogle,
  logout as logoutRequest,
  registerWithCredentials,
} from "../api/auth";
import { clearTokens, getRefreshToken, setTokens } from "../utils/tokenStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const resetSessionData = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
  }, [queryClient]);

  const loadUser = useCallback(async () => {
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
    } catch {
      await resetSessionData();
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [resetSessionData]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /** Store tokens + set user from any auth response. */
  const _handleAuthResponse = useCallback(
    async (response) => {
      await resetSessionData();
      setTokens({ access: response.access, refresh: response.refresh });
      setUser(response.user);
      return response;
    },
    [resetSessionData]
  );

  const loginWithGoogleCredential = useCallback(
    async (googleCredential) => {
      const response = await loginWithGoogle(googleCredential);
      return _handleAuthResponse(response);
    },
    [_handleAuthResponse]
  );

  const login = useCallback(
    async (email, password) => {
      const response = await loginWithCredentials(email, password);
      return _handleAuthResponse(response);
    },
    [_handleAuthResponse]
  );

  const register = useCallback(
    async (name, email, password, passwordConfirm) => {
      const response = await registerWithCredentials(name, email, password, passwordConfirm);
      return _handleAuthResponse(response);
    },
    [_handleAuthResponse]
  );

  const logout = useCallback(async () => {
    try {
      const refresh = getRefreshToken();
      if (refresh) await logoutRequest(refresh);
    } catch {
      // Always clear local session even if API fails.
    } finally {
      await resetSessionData();
      clearTokens();
      setUser(null);
    }
  }, [resetSessionData]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      loginWithGoogle: loginWithGoogleCredential,
      login,
      register,
      logout,
      refreshUser: loadUser,
    }),
    [user, loading, loginWithGoogleCredential, login, register, logout, loadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
