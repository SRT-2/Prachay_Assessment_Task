import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // restore the logged-in user after a page refresh
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    const { access_token, user } = response.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
