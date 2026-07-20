import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout/DashboardLayout";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";

import ClassroomHome from "../features/classroom/pages/ClassroomHome";
import CreateClassroom from "../features/classroom/pages/CreateClassroom";

import Dashboard from "../features/dashboard/Dashboard";

import ProtectedRoute from "./ProtectedRoute";

import LiveClassroom from "../features/dashboard/pages/LiveClassroom/LiveClassroom";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/classrooms" element={<ClassroomHome />} />
            <Route path="/classrooms/create" element={<CreateClassroom />} />
            <Route path="/live/:sessionId" element={<LiveClassroom />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
