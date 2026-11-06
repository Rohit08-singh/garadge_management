
import { createContext, useEffect, useState } from "react";
import { authApi } from "../api/auth.api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore login session when frontend refreshes
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (error) {
        localStorage.removeItem("access_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Login owner or operator
  const login = async (credentials) => {
    const response = await authApi.login(credentials);

    const token = response.access_token || response.token;

    if (!token) {
      throw new Error("Access token not found in login response.");
    }

    localStorage.setItem("access_token", token);

    try {
      const userData = await authApi.getMe();
      setUser(userData);
      return userData;
    } catch (error) {
      localStorage.removeItem("access_token");
      throw error;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
