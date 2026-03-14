import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useNavigate,
  Outlet,
} from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./Login";
import App from "./App";
import { useAuth } from "./AuthContext";
import UserDetails from "./UserDetails";

function Layout() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {isAuthenticated() ? (
        <button
          onClick={() => logout()}
          style={{
            height: "30px",
            width: "100px",
            position: "fixed",
            right: "30px",
            top: "30px",
          }}
        >
          Logout
        </button>
      ) : (
        <button
          onClick={() => navigate("/list")}
          style={{
            height: "30px",
            width: "100px",
            position: "fixed",
            right: "30px",
            top: "30px",
          }}
        >
          Login
        </button>
      )}
      <Outlet />
    </>
  );
}

function CatchAllRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated() ? (
    <Navigate to="/list" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "list",
        element: (
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        ),
      },
      {
        path:"details/:id",
        element: (
          <ProtectedRoute>
            <UserDetails />
          </ProtectedRoute>
        )
      },
      {
        path: "*",
        element: <CatchAllRoute />,
      },
    ],
  },
]);

function MainApp() {
  return <RouterProvider router={router} />;
}

export default MainApp;