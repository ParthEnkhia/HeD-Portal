import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("leavePortalToken");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem("leavePortalToken");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const authenticate = async (mode, payload) => {
    const endpoint = mode === "signup" ? "/auth/signup" : "/auth/signin";
    const { data } = await api.post(endpoint, payload);

    if (data.pendingApproval) {
      localStorage.removeItem("leavePortalToken");
      setUser(null);
      return data;
    }

    localStorage.setItem("leavePortalToken", data.token);
    setUser(data.user);
    return data;
  };

  const signOut = () => {
    localStorage.removeItem("leavePortalToken");
    setUser(null);
  };

  const updateProfile = async (profile) => {
    const { data } = await api.put("/auth/profile", profile);
    setUser(data);
    return data;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      authenticate,
      updateProfile,
      signOut
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
