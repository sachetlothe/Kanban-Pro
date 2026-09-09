import { createContext, useEffect, useMemo, useState } from "react";
import { getMeRequest, loginRequest, registerRequest } from "../api/authApi";
import { setAuthToken } from "../api/client";

export const AuthContext = createContext(null);

const STORAGE_KEY = "kanban-pro-auth";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setAuthToken(token);

    if (!token) {
      setUser(null);
      setIsBooting(false);
      return;
    }

    getMeRequest()
      .then((response) => {
        setUser(response.user);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setAuthToken(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsBooting(false);
      });
  }, [token]);

  const persistSession = ({ token: nextToken, user: nextUser }) => {
    localStorage.setItem(STORAGE_KEY, nextToken);
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setError("");
  };

  const login = async (payload) => {
    const response = await loginRequest(payload);
    persistSession(response);
  };

  const register = async (payload) => {
    const response = await registerRequest(payload);
    persistSession(response);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      error,
      isBooting,
      login,
      register,
      logout,
      setError,
    }),
    [token, user, error, isBooting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
