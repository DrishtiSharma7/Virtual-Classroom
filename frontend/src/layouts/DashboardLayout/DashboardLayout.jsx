import { Outlet, useLocation } from "react-router-dom";
import "./DashboardLayout.css";
import { useState, useEffect, Suspense } from "react";
import Sidebar from "../../features/dashboard/components/Sidebar/Sidebar";
import TopNavbar from "../../features/dashboard/components/TopNavbar/TopNavbar";

const DashboardLayout = ({ showNavbar }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Desktop navbar rule:
  // On desktop, TopNavbar is shown for /dashboard, /classrooms/create, /classrooms/join.
  // On desktop, TopNavbar is hidden for /classrooms, /attendance, /quizzes, /recordings, /analytics, /settings.
  // On mobile & tablet (< lg), TopNavbar is always visible.
  const path = location.pathname;
  const isDesktopNavRoute =
    path === "/dashboard" ||
    path.startsWith("/classrooms/create") ||
    path.startsWith("/classrooms/join");

  const showNav = showNavbar !== undefined ? showNavbar : isDesktopNavRoute;

  return (
    <div className="dashboard-layout">
      {sidebarOpen && (
        <div
          className="sidebar-overlay cursor-pointer"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="dashboard-main">
        {showNav ? (
          <TopNavbar setSidebarOpen={setSidebarOpen} />
        ) : (
          <div className="lg:hidden">
            <TopNavbar setSidebarOpen={setSidebarOpen} />
          </div>
        )}

        <main className="dashboard-content px-5 sm:px-8 lg:px-0 lg:pb-4">
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] w-full items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
          <div className="h-6 sm:h-8 lg:hidden w-full shrink-0 pointer-events-none" aria-hidden="true" />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
