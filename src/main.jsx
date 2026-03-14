import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import MainApp from "./MainApp.jsx";
import { AuthProvider } from "./AuthContext";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <StrictMode>
      <MainApp />
    </StrictMode>
  </AuthProvider>
);