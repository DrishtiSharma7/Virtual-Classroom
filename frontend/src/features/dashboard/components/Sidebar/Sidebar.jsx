import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  CalendarCheck,
  FileText,
  ClipboardCheck,
  Users,
  Video,
  ChartColumn,
  Settings,
  LogOut,
} from "lucide-react";
import useAuth from "../../../auth/hooks/useAuth";
import "./Sidebar.css";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Bug #13: signOut() existed in useAuth/authSlice but nothing called it.
  const handleLogout = () => {
    setSidebarOpen(false);
    signOut();
    navigate("/login", { replace: true });
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
      icon: <FileText />,
      label: "Assignments",
      path: "/assignments",
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
        <GraduationCap className="sidebar-logo-icon" />
        <span className="sidebar-logo-text">Virtual Classroom</span>
      </header>
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-100 px-4 py-4">
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <span className="sidebar-icon">
            <LogOut />
          </span>
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;