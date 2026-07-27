import { Outlet } from "react-router-dom";
import "./DashboardLayout.css";
import { useState } from "react";
import Sidebar from "../../features/dashboard/components/Sidebar/Sidebar";
import TopNavbar from "../../features/dashboard/components/TopNavbar/TopNavbar";

const DashboardLayout = ({ showNavbar = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="dashboard-main">
        {showNavbar && <TopNavbar setSidebarOpen={setSidebarOpen} />}

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
