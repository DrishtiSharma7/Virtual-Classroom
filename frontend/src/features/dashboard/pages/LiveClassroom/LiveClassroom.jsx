import React from "react";
import {
  Bell,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Pencil,
  Users,
  MessageCircle,
} from "lucide-react";

import "./LiveClassroom.css";

const LiveClassroom = () => {
  return (
    <div className="live-classroom">
      {/* Header */}
      <header className="live-header">
        <div className="course-info">
          <h2>📚 Advanced Mathematics 101</h2>

          <div className="session-info">
            <span className="live-badge">🔴 LIVE</span>
            <span>01:15:30</span>
            <span>Recording</span>
          </div>
        </div>

        <div className="teacher-controls">
          <button className="end-btn">End Session</button>

          <Bell />

          <img src="https://i.pravatar.cc/40" alt="" className="profile" />
        </div>
      </header>

      {/* Main */}

      <div className="main-content">
        {/* Whiteboard */}

        <div className="whiteboard">
          <div className="toolbar">
            <Pencil />
            <Mic />
            <Video />
            <MonitorUp />
          </div>

          <div className="board">
            <h1>🖊 Whiteboard</h1>

            <p>Whiteboard Canvas will come here.</p>
          </div>
        </div>

        {/* Right Sidebar */}

        <aside className="sidebar">
          <div className="participants">
            <h3>
              <Users size={18} />
              Participants
            </h3>

            <div className="user">Sarah Johnson</div>

            <div className="user">Priya Sharma</div>

            <div className="user">Rahul</div>
          </div>

          <div className="chat">
            <h3>
              <MessageCircle size={18} />
              Chat
            </h3>

            <div className="message">
              <strong>Priya</strong>

              <p>Can you explain again?</p>
            </div>

            <div className="message">
              <strong>Teacher</strong>

              <p>Sure 👍</p>
            </div>

            <input placeholder="Type message..." />
          </div>
        </aside>
      </div>

      {/* Bottom Controls */}

      <footer className="bottom-controls">
        <button>
          <Mic />
        </button>

        <button>
          <Video />
        </button>

        <button>
          <MonitorUp />
        </button>

        <button className="danger">
          <PhoneOff />
        </button>
      </footer>
    </div>
  );
};

export default LiveClassroom;
