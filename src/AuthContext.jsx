import { createContext, useState, useContext } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedSession = localStorage.getItem("authUser");
    return savedSession ? JSON.parse(savedSession) : null;
  });

  const login = (username, password) => {
    if (username === "testuser" && password === "Test123") {
      const userData = { username, password};
      setUser(userData);
      localStorage.setItem("authUser", JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const isAuthenticated = () => {
      const data=localStorage.getItem("authUser");
      const res=JSON.parse(data);
    return (res && res?.username === "testuser" && res?.password === "Test123") 
  }

  const logout = () => {
    console.log("dasfasdf")
    setUser(null);
    localStorage.removeItem("authUser");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout ,isAuthenticated}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);