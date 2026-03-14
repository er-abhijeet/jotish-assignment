import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const { login , isAuthenticated} = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const success = login(username, password);
    
    if (success) {
      navigate("/list");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  if(isAuthenticated())navigate("/list");

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "100px" }}>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "12px", width: "300px" }}>
        <h2>System Login</h2>
        {error && <div style={{ color: "#ef4444", fontSize: "14px" }}>{error}</div>}
        
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          style={{ padding: "8px" }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ padding: "8px" }}
        />
        <button type="submit" style={{ padding: "10px", cursor: "pointer" }}>Login</button>
      </form>
    </div>
  );
};

export default Login;