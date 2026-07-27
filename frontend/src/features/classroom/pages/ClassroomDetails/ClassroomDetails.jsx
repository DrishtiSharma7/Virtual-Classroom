import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Video,
  Users,
  ClipboardList,
  CalendarDays,
  BookOpen,
  Bell,
  PlayCircle,
  ArrowRight,
  UserCircle2,
  Clock3,
} from "lucide-react";

import "./ClassroomDetails.css";
import { getClassroomById } from "../../api/classroom.api";

function ClassroomDetails() {
  const { classroomId } = useParams();

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClassroom();
  }, [classroomId]);

  const fetchClassroom = async () => {
    try {
      const data = await getClassroomById(classroomId);
      setClassroom(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load classroom.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="classroom-loading">Loading...</div>;
  }

  if (error) {
    return <div className="classroom-error">{error}</div>;
  }

  if (!classroom) {
    return <div className="classroom-error">Classroom not found.</div>;
  }

  const students = classroom.students || [];
  const assignments = classroom.assignments || [];
  const recordings = classroom.recordings || [];
  const announcements = classroom.announcements || [];

  return (
    <div className="details-page">
      <div className="details-container">
        {/* Back */}

        <Link to="/classrooms" className="back-btn">
          <ArrowLeft size={18} />
          Back to Classrooms
        </Link>

        {/* Banner */}

        <div className="class-banner">
          <div>
            <h1 className="class-title">{classroom.name}</h1>

            <p className="class-subject">{classroom.subject}</p>

            <div className="class-meta">
              <span className="meta-chip">Room Code : {classroom.code}</span>

              <span className="meta-chip">{students.length} Students</span>

              <span className="meta-chip active">Active</span>
            </div>
          </div>

          <button className="live-btn">
            <Video size={18} />
            Start Live Session
          </button>
        </div>

        {/* Stats */}

        <div className="stats-grid">
          <div className="stat-card">
            <Users size={26} className="stat-icon indigo" />
            <p>Total Students</p>
            <h2>{students.length}</h2>
          </div>

          <div className="stat-card">
            <ClipboardList size={26} className="stat-icon green" />
            <p>Assignments</p>
            <h2>{assignments.length}</h2>
          </div>

          <Link to={`/attendance/${classroom._id}`} className="stat-card">
            <CalendarDays size={26} className="stat-icon blue" />
            <p>Attendance</p>
            <h2>91%</h2>
          </Link>

          <div className="stat-card">
            <PlayCircle size={26} className="stat-icon purple" />
            <p>Recordings</p>
            <h2>{recordings.length}</h2>
          </div>
        </div>

        {/* Main Grid */}

        <div className="details-grid">
          {/* LEFT */}

          <div className="left-section">
            {/* Live Session */}

            <div className="section-card">
              <div className="section-title">
                <Video size={20} />
                Today's Live Session
              </div>

              <h3>React Authentication using JWT</h3>

              <p>Join today's scheduled live lecture.</p>

              <div className="session-time">
                <Clock3 size={16} />
                Today • 2:00 PM - 3:00 PM
              </div>

              <button className="join-btn">
                Join Session
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Announcements */}

            <div className="section-card">
              <div className="section-title">
                <Bell size={20} />
                Announcements
              </div>

              {announcements.length === 0 ? (
                <p className="empty-text">No announcements available.</p>
              ) : (
                announcements.map((item, index) => (
                  <div key={index} className="announcement-item">
                    <h4>{item.title}</h4>

                    <p>{item.description}</p>
                  </div>
                ))
              )}
            </div>

            {/* Assignments */}

            <div className="section-card">
              <div className="section-title">
                <BookOpen size={20} />
                Assignments
              </div>

              {assignments.length === 0 ? (
                <p className="empty-text">No assignments uploaded.</p>
              ) : (
                assignments.slice(0, 5).map((assignment) => (
                  <div key={assignment._id} className="assignment-item">
                    <div>
                      <h4>{assignment.title}</h4>

                      <p>Due : {assignment.dueDate || "Not Available"}</p>
                    </div>

                    <button className="view-btn">View</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT */}

          <div className="right-section">
            {/* Students */}

            <div className="section-card">
              <div className="section-title">
                <Users size={20} />
                Students
              </div>

              {students.length === 0 ? (
                <p className="empty-text">No students joined.</p>
              ) : (
                <div className="students-list">
                  {students.map((student, index) => (
                    <div key={student._id || index} className="student-row">
                      <div className="student-left">
                        <UserCircle2 size={38} />

                        <div>
                          <h4>{student.name}</h4>
                          <p>{student.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recordings */}

            <div className="section-card">
              <div className="section-title">
                <PlayCircle size={20} />
                Recordings
              </div>

              {recordings.length === 0 ? (
                <p className="empty-text">No recordings found.</p>
              ) : (
                recordings.slice(0, 5).map((video, index) => (
                  <div key={video._id || index} className="recording-row">
                    <div>
                      <h4>{video.title}</h4>

                      <p>Recorded Lecture</p>
                    </div>

                    <button className="watch-btn">Watch</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassroomDetails;
