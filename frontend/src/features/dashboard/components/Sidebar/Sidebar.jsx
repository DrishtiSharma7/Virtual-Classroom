/*import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaChalkboardTeacher,
  FaUserCheck,
  FaClipboardList,
  FaQuestionCircle,
  FaVideo,
  FaChartBar,
  FaCog,
} from "react-icons/fa";

import "./Sidebar.css";

const Sidebar = () => {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <FaTachometerAlt />,
    },
    {
      name: "Classrooms",
      path: "/classrooms",
      icon: <FaChalkboardTeacher />,
    },
    {
      name: "Attendance",
      path: "/attendance",
      icon: <FaUserCheck />,
    },
    {
      name: "Assignments",
      path: "/assignments",
      icon: <FaClipboardList />,
    },
    {
      name: "Quizzes",
      path: "/quizzes",
      icon: <FaQuestionCircle />,
    },
    {
      name: "Recordings",
      path: "/recordings",
      icon: <FaVideo />,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: <FaChartBar />,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <FaCog />,
    },
  ];

  return (
      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span>{item.icon}</span>

            <span>{item.name}</span>

          </NavLink>
        ))}

      </nav>
  );
};

export default Sidebar;*/

import React from 'react';
import {LayoutDashboard, CalendarCheck, FileText, ClipboardCheck, Users, Video, ChartColumn, Settings} from "lucide-react";
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { icon: <LayoutDashboard />, label: 'Dashboard', active: true },
    { icon: <Users />, label: 'Classrooms' },
    { icon: <CalendarCheck />, label: 'Attendance' },
    { icon: <FileText />, label: 'Assignments' },
    { icon: <ClipboardCheck />, label: 'Quizzes' },
    { icon: <Video />, label: 'Recordings' },
    { icon: <ChartColumn />, label: 'Analytics' },
    { icon: <Settings/>, label: 'Settings' },
  ];

  return (
    <aside className="sidebar-container">
      <div className="sidebar-logo">
        <span className="text-2xl">🎓</span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <button key={index} className={`sidebar-link ${item.active ? 'active' : ''}`}>
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;