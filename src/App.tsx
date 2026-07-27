import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CitizenDashboard from "./pages/CitizenDashboard";
import SupportCenters from "./pages/SupportCenters";
import DamageClaim from "./pages/DamageClaim";
import CrisisLaws from "./pages/CrisisLaws";
import CrisisReports from "./pages/CrisisReports";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/auth/login", element: <Login /> },
  { path: "/auth/register", element: <Register /> },
  { path: "/dashboard/citizen", element: <CitizenDashboard /> },
  { path: "/dashboard/support", element: <SupportCenters /> },
  { path: "/dashboard/damage-claim", element: <DamageClaim /> },
  { path: "/dashboard/laws", element: <CrisisLaws /> },
  { path: "/dashboard/reports", element: <CrisisReports /> },
  { path: "/admin", element: <Navigate to="/admin/login" replace /> },
  { path: "/admin/login", element: <AdminLogin /> },
  { path: "/admin/dashboard", element: <AdminDashboard /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
