import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout/DashboardLayout";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";

import ClassroomHome from "../features/classroom/pages/ClassroomHome/ClassroomHome";
import ClassroomDetails from "../features/classroom/pages/ClassroomDetails/ClassroomDetails";
import CreateClassroom from "../features/classroom/pages/CreateClassroom/CreateClassroom";
import JoinClassroom from "../features/classroom/pages/JoinClassroom/JoinClassroom";
import AttendanceHome from "../features/classroom/pages/AttendanceHome/AttendanceHome";
import TeacherAssignmentHome from "../features/classroom/pages/AssignmentHome/TeacherAssignmentHome";
import LiveClassroom from "../features/dashboard/pages/LiveClassroom/LiveClassroom";
import QuizHome from "../features/classroom/pages/QuizHome/QuizHome";
import QuizDetail from "../features/classroom/pages/QuizHome/QuizDetail";

import Dashboard from "../features/dashboard/Dashboard";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

import SettingsPage from "../features/settings/pages/SettingsPage/SettingsPage";

import { Sidebar } from "lucide-react";

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
          <Route element={<DashboardLayout showNavbar={true} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/classrooms/create" element={
                <RoleRoute allow={["teacher"]}>
                  <CreateClassroom />
                </RoleRoute>
              }
            />
            <Route path="/classrooms/join" element={<JoinClassroom />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout showNavbar={false} />}>
            <Route path="/classrooms" element={<ClassroomHome />} />
            <Route path="/classrooms/:classroomId" element={<ClassroomDetails />} />
            <Route path="/attendance" element={<AttendanceHome />} />
            <Route path="/attendance/:id" element={<AttendanceHome />} />
            <Route path="/assignments" element={<TeacherAssignmentHome />} />
            <Route path="/quizzes" element={<QuizHome />} />
            <Route path="/quizzes/:quizId" element={<QuizDetail />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/live/:sessionId" element={<LiveClassroom />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
