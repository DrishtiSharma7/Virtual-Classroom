import React from "react";
import { NavLink } from "react-router-dom";
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
} from "lucide-react";
import "./Sidebar.css";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
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
    </aside>
  );
};

export default Sidebar;
