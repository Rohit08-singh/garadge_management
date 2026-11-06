
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Drivers from "../pages/Drivers";
import DailyRegister from "../pages/DailyRegister";
import Payments from "../pages/Payments";
import Reports from "../pages/Reports";
import Notifications from "../pages/Notifications";

// Components
import ProtectedRoute from "../components/common/ProtectedRoute";
import MainLayout from "../components/layout/MainLayout";

// Authentication
import useAuth from "../hooks/useAuth";

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Login Page */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Protected Application Layout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Drivers */}
        <Route
          path="/drivers"
          element={<Drivers />}
        />

        {/* Daily Register */}
        <Route
          path="/daily-register"
          element={<DailyRegister />}
        />

        {/* Payments */}
        <Route
          path="/payments"
          element={<Payments />}
        />

        {/* Reports */}
        <Route
          path="/reports"
          element={<Reports />}
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={<Notifications />}
        />
      </Route>

      {/* Default Route */}
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      {/* Unknown Routes */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
