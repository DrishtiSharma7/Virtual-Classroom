import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout/DashboardLayout";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import LandingPage from "../features/marketing/pages/LandingPage/LandingPage";

function lazyWithRetry(componentImport) {
  return lazy(async () => {
    try {
      const mod = await componentImport();
      sessionStorage.removeItem("chunk_retry_" + window.location.pathname);
      return mod;
    } catch (error) {
      const hasRetried = sessionStorage.getItem("chunk_retry_" + window.location.pathname);
      if (!hasRetried) {
        sessionStorage.setItem("chunk_retry_" + window.location.pathname, "true");
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });
}

const ClassroomHome = lazyWithRetry(() => import("../features/classroom/pages/ClassroomHome/ClassroomHome"));
const ClassroomDetails = lazyWithRetry(() => import("../features/classroom/pages/ClassroomDetails/ClassroomDetails"));
const CreateClassroom = lazyWithRetry(() => import("../features/classroom/pages/CreateClassroom/CreateClassroom"));
const JoinClassroom = lazyWithRetry(() => import("../features/classroom/pages/JoinClassroom/JoinClassroom"));
const AttendanceHome = lazyWithRetry(() => import("../features/classroom/pages/AttendanceHome/AttendanceHome"));
const LiveClassroom = lazyWithRetry(() => import("../features/dashboard/pages/LiveClassroom/LiveClassroom"));
const QuizHome = lazyWithRetry(() => import("../features/classroom/pages/QuizHome/QuizHome"));
const QuizDetail = lazyWithRetry(() => import("../features/classroom/pages/QuizHome/QuizDetail"));
const RecordingsHome = lazyWithRetry(() => import("../features/classroom/pages/RecordingsHome/RecordingsHome"));
import Dashboard from "../features/dashboard/Dashboard";
const AnalyticsDashboard = lazyWithRetry(() => import("../features/analytics/pages/AnalyticsDashboard/AnalyticsDashboard"));
const SettingsPage = lazyWithRetry(() => import("../features/settings/pages/SettingsPage/SettingsPage"));

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RoleRoute from "./RoleRoute";

function RouteFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5b5fef] border-t-transparent" />
    </div>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>

          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
          </Route>


          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/classrooms/create"
                element={
                  <RoleRoute allow={["teacher"]}>
                    <CreateClassroom />
                  </RoleRoute>
                }
              />
              <Route path="/classrooms/join" element={<JoinClassroom />} />
              <Route path="/classrooms" element={<ClassroomHome />} />
              <Route path="/classrooms/:classroomId" element={<ClassroomDetails />} />
              <Route path="/attendance" element={<AttendanceHome />} />
              <Route path="/attendance/:id" element={<AttendanceHome />} />
              <Route path="/quizzes" element={<QuizHome />} />
              <Route path="/quizzes/:quizId" element={<QuizDetail />} />
              <Route path="/recordings" element={<RecordingsHome />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/live/:sessionId" element={<LiveClassroom />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRouter;
