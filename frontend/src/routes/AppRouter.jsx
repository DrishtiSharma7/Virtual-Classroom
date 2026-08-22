import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout/DashboardLayout";

// Login/register/landing are the unauthenticated entry points, so they
// stay eagerly bundled — everything below is only ever reached after
// signing in, and is lazy-loaded so those entry pages (and the login/
// register flow itself) don't have to download the whole authenticated
// app — dashboard, whiteboard, live video/WebRTC, xlsx/jsPDF exports,
// etc. — before they can even render a form.
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import LandingPage from "../features/marketing/pages/LandingPage/LandingPage";

const ClassroomHome = lazy(() => import("../features/classroom/pages/ClassroomHome/ClassroomHome"));
const ClassroomDetails = lazy(() => import("../features/classroom/pages/ClassroomDetails/ClassroomDetails"));
const CreateClassroom = lazy(() => import("../features/classroom/pages/CreateClassroom/CreateClassroom"));
const JoinClassroom = lazy(() => import("../features/classroom/pages/JoinClassroom/JoinClassroom"));
const AttendanceHome = lazy(() => import("../features/classroom/pages/AttendanceHome/AttendanceHome"));
const LiveClassroom = lazy(() => import("../features/dashboard/pages/LiveClassroom/LiveClassroom"));
const QuizHome = lazy(() => import("../features/classroom/pages/QuizHome/QuizHome"));
const QuizDetail = lazy(() => import("../features/classroom/pages/QuizHome/QuizDetail"));
const RecordingsHome = lazy(() => import("../features/classroom/pages/RecordingsHome/RecordingsHome"));
const Dashboard = lazy(() => import("../features/dashboard/Dashboard"));
const SettingsPage = lazy(() => import("../features/settings/pages/SettingsPage/SettingsPage"));

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

// Route-level Suspense fallback only — brief, since chunks this small are
// typically cached/fetched in well under a second on any real connection.
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
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/" element={<LandingPage />} />
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
              <Route path="/quizzes" element={<QuizHome />} />
              <Route path="/quizzes/:quizId" element={<QuizDetail />} />
              <Route path="/recordings" element={<RecordingsHome />} />
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
