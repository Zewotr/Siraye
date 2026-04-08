import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { fetchCurrentUser, loginWithEmail, loginWithGoogle, logout as logoutRequest } from "../api/auth";
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

  const loginWithGoogleCredential = useCallback(
    async (googleCredential) => {
      const response = await loginWithGoogle(googleCredential);
      await resetSessionData();
      setTokens({ access: response.access, refresh: response.refresh });
      setUser(response.user);
      return response;
    },
    [resetSessionData]
  );

  const loginWithEmailAddress = useCallback(
    async (email) => {
      const response = await loginWithEmail(email);
      await resetSessionData();
      setTokens({ access: response.access, refresh: response.refresh });
      setUser(response.user);
      return response;
    },
    [resetSessionData]
  );

  const logout = useCallback(
    async () => {
      try {
        const refresh = getRefreshToken();
        if (refresh) {
          await logoutRequest(refresh);
        }
      } catch {
        // Ignore logout API failures and always clear local session.
      } finally {
        await resetSessionData();
        clearTokens();
        setUser(null);
      }
    },
    [resetSessionData]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      loginWithGoogle: loginWithGoogleCredential,
      loginWithEmail: loginWithEmailAddress,
      logout,
      refreshUser: loadUser,
    }),
    [user, loading, loginWithGoogleCredential, loginWithEmailAddress, logout, loadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
