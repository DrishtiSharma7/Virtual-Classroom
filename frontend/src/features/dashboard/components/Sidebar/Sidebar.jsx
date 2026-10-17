import { useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
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
import logoImg from "../../../../assets/Logo.png";
import useAuth from "../../../auth/hooks/useAuth";
import "./Sidebar.css";

const prefetchRoutes = () => {
  import("../../../classroom/pages/ClassroomHome/ClassroomHome").catch(() => {});
  import("../../../classroom/pages/AttendanceHome/AttendanceHome").catch(() => {});
  import("../../../classroom/pages/QuizHome/QuizHome").catch(() => {});
  import("../../../classroom/pages/RecordingsHome/RecordingsHome").catch(() => {});
  import("../../../analytics/pages/AnalyticsDashboard/AnalyticsDashboard").catch(() => {});
  import("../../../settings/pages/SettingsPage/SettingsPage").catch(() => {});
};

const MENU_ITEMS = [
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

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  const menuItems = MENU_ITEMS;

  return (
    <aside className={`sidebar-container ${sidebarOpen ? "open" : ""}`}>
      <header className="sidebar-header">
        <Link
          to="/dashboard"
          onClick={handleNavClick}
          className="flex flex-col items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-105"
          aria-label="Virtual Classroom"
        >
          <img
            src={logoImg}
            alt="Virtual Classroom Logo"
            className="sidebar-logo-icon shrink-0 object-contain"
          />
          <h2 className="sidebar-logo-title">Virtual Classroom</h2>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute right-3 top-3 z-10 p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer"
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
            onClick={handleNavClick}
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
      <div className="border-t border-gray-100 py-1 pl-3">
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