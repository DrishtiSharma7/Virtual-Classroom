import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LayoutDashboard,
  CalendarCheck,
  ClipboardCheck,
  Users,
  Video,
  ChartColumn,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronUp,
  X,
} from "lucide-react";
import logoImg from "../../../../assets/Logo.png";
import useAuth from "../../../auth/hooks/useAuth";
import useTheme from "../../../../hooks/useTheme";
import UserAvatar from "../../../../components/UserAvatar/UserAvatar";
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

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed = false,
  setSidebarCollapsed,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { user, role } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
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

  useEffect(() => {
    if (!userMenuOpen) return;

    const handlePointerDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const openUserMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setUserMenuOpen(true);
  };

  const scheduleCloseUserMenu = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setUserMenuOpen(false);
    }, 150);
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    setSidebarOpen(false);
    signOut();
    navigate("/login", { replace: true });
  };

  const handleGoToSettings = () => {
    setUserMenuOpen(false);
    setSidebarOpen(false);
    navigate("/settings");
  };

  const handleNavClick = () => {
    setUserMenuOpen(false);
    setSidebarOpen(false);
  };

  const handleBrandClick = () => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches &&
      setSidebarCollapsed
    ) {
      setSidebarCollapsed((prev) => !prev);
      return;
    }
    setSidebarOpen(false);
    navigate("/dashboard");
  };

  const menuItems = MENU_ITEMS;
  const userName = user?.name || "User";
  const userSubtitle =
    user?.email || (role === "teacher" ? "Teacher" : "Student");

  return (
    <aside
      className={`sidebar-container ${sidebarOpen ? "open" : ""} ${
        sidebarCollapsed ? "collapsed" : ""
      }`}
    >
      <header className="sidebar-header">
        <button
          type="button"
          onClick={handleBrandClick}
          className="sidebar-brand-btn flex flex-col items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!sidebarCollapsed}
          data-tooltip={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <img
            src={logoImg}
            alt="Virtual Classroom Logo"
            className="sidebar-logo-icon shrink-0 object-contain"
          />
          <h2 className="sidebar-logo-title">Virtual Classroom</h2>
        </button>
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
            aria-label={item.label}
            data-tooltip={sidebarCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `sidebar-link cursor-pointer ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon pointer-events-none">{item.icon}</span>
            <span className="sidebar-label pointer-events-none">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div
        ref={userMenuRef}
        className="sidebar-footer"
        onMouseEnter={openUserMenu}
        onMouseLeave={scheduleCloseUserMenu}
      >
        {userMenuOpen && (
          <div
            className={`sidebar-user-popover ${
              sidebarCollapsed ? "collapsed-popover" : ""
            }`}
            role="menu"
            aria-label="User menu"
          >
            <div className="sidebar-user-popover-header">
              <UserAvatar
                id={user?._id || user?.id}
                name={userName}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 truncate">{userSubtitle}</p>
              </div>
            </div>

            <div className="py-1 space-y-0.5">
              <button
                type="button"
                role="menuitem"
                data-no-tooltip
                onClick={toggleTheme}
                className="sidebar-user-menu-item"
              >
                <span className="flex items-center gap-2.5">
                  {theme === "dark" ? (
                    <Sun size={16} className="text-amber-500 shrink-0" />
                  ) : (
                    <Moon size={16} className="text-indigo-600 shrink-0" />
                  )}
                  <span>Theme</span>
                </span>
                <span className="sidebar-theme-badge">
                  {theme === "dark" ? "Dark" : "Light"}
                </span>
              </button>

              <button
                type="button"
                role="menuitem"
                data-no-tooltip
                onClick={handleGoToSettings}
                className="sidebar-user-menu-item"
              >
                <span className="flex items-center gap-2.5">
                  <Settings size={16} className="text-gray-500 shrink-0" />
                  <span>Settings</span>
                </span>
              </button>
            </div>

            <div className="border-t border-gray-100 pt-1 mt-1">
              <button
                type="button"
                role="menuitem"
                data-no-tooltip
                onClick={handleLogout}
                className="sidebar-user-menu-item danger"
              >
                <span className="flex items-center gap-2.5">
                  <LogOut size={16} className="shrink-0" />
                  <span>Logout</span>
                </span>
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          data-no-tooltip
          onClick={() => setUserMenuOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
          aria-label={`User menu for ${userName}`}
          className="sidebar-user-trigger"
        >
          <UserAvatar id={user?._id || user?.id} name={userName} size="sm" />
          <div className="sidebar-user-meta">
            <span className="sidebar-user-name">{userName}</span>
            <span className="sidebar-user-role">
              {role === "teacher" ? "Teacher" : "Student"}
            </span>
          </div>
          <ChevronUp
            size={16}
            className={`sidebar-user-chevron transition-transform duration-150 ${
              userMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;