import { Outlet } from "react-router-dom";
import "./DashboardLayout.css";

import Sidebar from "../../features/dashboard/components/Sidebar/Sidebar";
import TopNavbar from "../../features/dashboard/components/TopNavbar/TopNavbar";

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      {/* Sidebar Component (Iske andar khud wrapper built-in hai) */}
      <Sidebar />

      {/* Main Section Area */}
      <div className="dashboard-main">
        {/* Navbar Component */}
        <TopNavbar />

        {/* Dynamic Page Content Routing Box */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;