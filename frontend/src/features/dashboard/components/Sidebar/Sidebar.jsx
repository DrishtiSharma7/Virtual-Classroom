import React, { useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  CalendarCheck,
  ClipboardCheck,
  Users,
  Video,
  ChartColumn,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import useAuth from "../../../auth/hooks/useAuth";
import "./Sidebar.css";

const prefetchRoutes = () => {
  try {
    import("../../../classroom/pages/ClassroomHome/ClassroomHome");
    import("../../../classroom/pages/AttendanceHome/AttendanceHome");
    import("../../../classroom/pages/QuizHome/QuizHome");
    import("../../../classroom/pages/RecordingsHome/RecordingsHome");
    import("../../../analytics/pages/AnalyticsDashboard/AnalyticsDashboard");
    import("../../../settings/pages/SettingsPage/SettingsPage");
  } catch {
  }
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  useEffect(() => {
    const timer = setTimeout(prefetchRoutes, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      prefetchRoutes();
    }
  }, [sidebarOpen]);

  const handleLogout = () => {
    setSidebarOpen(false);
    signOut();
    navigate("/login", { replace: true });
  };

  const handleNavClick = (e, path) => {
    e.preventDefault();
    if (location.pathname !== path) {
      navigate(path);
    }
    setSidebarOpen(false);
  };

  const menuItems = [
    {
      icon: <LayoutDashboard />,
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: <Users />,
      label: "Classrooms",
      path: "/classrooms",
    },
    {
      icon: <CalendarCheck />,
      label: "Attendance",
      path: "/attendance",
    },
    {
      icon: <ClipboardCheck />,
      label: "Quizzes",
      path: "/quizzes",
    },
    {
      icon: <Video />,
      label: "Recordings",
      path: "/recordings",
    },
    {
      icon: <ChartColumn />,
      label: "Analytics",
      path: "/analytics",
    },
    {
      icon: <Settings />,
      label: "Settings",
      path: "/settings",
    },
  ];

  return (
    <aside className={`sidebar-container ${sidebarOpen ? "open" : ""}`}>
      <header className="sidebar-header">
        <div className="flex items-center space-x-3 min-w-0">
          <GraduationCap className="sidebar-logo-icon shrink-0" />
          <span className="sidebar-logo-text truncate">Virtual Classroom</span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition mr-1 cursor-pointer"
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </header>
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            onClick={(e) => handleNavClick(e, item.path)}
            onPointerEnter={prefetchRoutes}
            onTouchStart={prefetchRoutes}
            className={({ isActive }) =>
              `sidebar-link cursor-pointer ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon pointer-events-none">{item.icon}</span>
            <span className="sidebar-label pointer-events-none">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-100 px-4 py-4">
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
        >
          <span className="sidebar-icon pointer-events-none">
            <LogOut />
          </span>
          <span className="sidebar-label pointer-events-none">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;