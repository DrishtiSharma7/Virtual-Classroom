import { Outlet } from "react-router-dom";
import "./DashboardLayout.css";
import { useState } from "react";
import Sidebar from "../../features/dashboard/components/Sidebar/Sidebar";
import TopNavbar from "../../features/dashboard/components/TopNavbar/TopNavbar";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="dashboard-layout">
      {/* Sidebar Component (Iske andar khud wrapper built-in hai) */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Section Area */}
      <div className="dashboard-main">
        {/* Navbar Component */}
        <TopNavbar setSidebarOpen={setSidebarOpen} />

        {/* Dynamic Page Content Routing Box */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
