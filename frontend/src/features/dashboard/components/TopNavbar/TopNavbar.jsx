import React from 'react';
import {Bell, CircleUser} from "lucide-react";
import './TopNavbar.css';

const TopNavbar = () => {
  return (
    <header className="navbar-container">
      <h1 className="navbar-title">Teacher Dashboard</h1>
      <div className="navbar-profile-section">
        <button className="navbar-notification-btn">
          <Bell size={22} strokeWidth={2} color='black'/>
        </button>
        <div className="navbar-user-card">
          <CircleUser size={36} strokeWidth={1.5} color='black'/>
          <span className="navbar-username">Sarah Johnson</span>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;