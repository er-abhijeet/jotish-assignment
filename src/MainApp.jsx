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
import Visualization from "./Visualization";

function Layout() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {isAuthenticated() ? (
        <>
        <button
          onClick={() => logout()}
          style={{
            height: "40px",
            width: "100px",
            position: "fixed",
            right: "30px",
            top: "30px",
          }}
          >
          Logout
        </button>
        <button
          onClick={() => navigate("/visualization")}
          style={{
            height: "40px",
            width: "120px",
            position: "fixed",
            right: "30px",
            top: "100px",
            backgroundColor:"green",
            padding:"6px"
          }}
          >
          Visualization
        </button>
          </>
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
        index:true,
        element: <CatchAllRoute />
      },
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
        path:"visualization",
        element:(

          <ProtectedRoute>
            <Visualization />
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