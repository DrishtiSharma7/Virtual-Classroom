import React from "react";
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
    { icon: <LayoutDashboard />, label: "Dashboard", active: true },
    { icon: <Users />, label: "Classrooms" },
    { icon: <CalendarCheck />, label: "Attendance" },
    { icon: <FileText />, label: "Assignments" },
    { icon: <ClipboardCheck />, label: "Quizzes" },
    { icon: <Video />, label: "Recordings" },
    { icon: <ChartColumn />, label: "Analytics" },
    { icon: <Settings />, label: "Settings" },
  ];

  return (
    <aside className={`sidebar-container ${sidebarOpen ? "open" : ""}`}>
      <header className="sidebar-header">
        <GraduationCap className="sidebar-logo-icon" />
        <span className="sidebar-logo-text">Virtual Classroom</span>
      </header>
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`sidebar-link ${item.active ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
