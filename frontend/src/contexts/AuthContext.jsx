import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { fetchCurrentUser, loginWithGoogle, logout as logoutRequest } from "../api/auth";
import { clearTokens, getRefreshToken, setTokens } from "../utils/tokenStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (googleCredential) => {
    const response = await loginWithGoogle(googleCredential);
    setTokens({ access: response.access, refresh: response.refresh });
    setUser(response.user);
    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refresh = getRefreshToken();
      if (refresh) {
        await logoutRequest(refresh);
      }
    } catch {
      // Ignore logout API failures and always clear local session.
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      login,
      logout,
      refreshUser: loadUser,
    }),
    [user, loading, login, logout, loadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
