import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Video,
  Users,
  CalendarDays,
  Bell,
  PlayCircle,
  ArrowRight,
  UserCircle2,
  Clock3,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";

import "./ClassroomDetails.css";
import { getClassroomById } from "../../api/classroom.api";
import { useNavigate } from "react-router-dom";
import { createSession, startSession, getSessionsByClassroom } from "../../../auth/api/session.api";
import usePageMeta from "../../../../hooks/usePageMeta";

function ClassroomDetails() {
  const { classroomId } = useParams();

  const [classroom, setClassroom] = useState(null);
  usePageMeta(classroom?.name || "Classroom");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [startingSession, setStartingSession] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;
  const isTeacher = role === "teacher";
  const isStudent = role === "student";
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

  const handleStartSession = async () => {
    try {
      setStartingSession(true);

      const createRes = await createSession({
        classroom: classroom._id,
        title: `${classroom.subject} Live Session`,
        description: `Live class for ${classroom.name}`,
        startTime: new Date(),
      });

      const session = createRes.data.session;

      await startSession(session._id);

      navigate(`/live/${session._id}`);
    } catch (err) {
      console.error(err);

      alert(err.response?.data?.message || "Unable to start session.");
    } finally {
      setStartingSession(false);
    }
  };

  const handleJoinSession = async () => {
  try {
    const res = await getSessionsByClassroom(classroom._id);
    const liveSession = res.data?.find((s) => s.status === "live");

    if (!liveSession) {
      alert("No live session running right now.");
      return;
    }

    navigate(`/live/${liveSession._id}`);
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Unable to join session.");
  }
};

  const handlePostAnnouncement = () => {
    navigate(`/classrooms/${classroom._id}/announcements/new`);
  };

  const handleUploadRecording = () => {
    navigate(`/classrooms/${classroom._id}/recordings/upload`);
  };

  const handleRemoveStudent = (studentId) => {
    if (!window.confirm("Remove this student from the classroom?"))
      return;
    console.log("Remove student:", studentId);
  };

  const students = classroom.students || [];
  const recordings = classroom.recordings || [];
  const announcements = classroom.announcements || [];

  return (
    <div className="details-page">
      <div className="details-container">

        <Link to="/classrooms" className="back-btn">
          <ArrowLeft size={18} />
          Back to Classrooms
        </Link>



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


          {isTeacher && (
            <button
              className="live-btn"
              onClick={handleStartSession}
              disabled={startingSession}
            >
              <Video size={18} />
              {startingSession ? "Starting..." : "Start Live Session"}
            </button>
          )}
        </div>



        <div className="stats-grid">
          <div className="stat-card">
            <Users size={26} className="stat-icon indigo" />
            <p>Total Students</p>
            <h2>{students.length}</h2>
          </div>

          <Link to={`/attendance/${classroom._id}`} className="stat-card">
            <CalendarDays size={26} className="stat-icon blue" />
            <p>{isTeacher ? "Attendance" : "My Attendance"}</p>
            <h2>91%</h2>
          </Link>

          <div className="stat-card">
            <PlayCircle size={26} className="stat-icon purple" />
            <p>Recordings</p>
            <h2>{recordings.length}</h2>
          </div>
        </div>



        <div className="details-grid">


          <div className="left-section">


            <div className="section-card">
              <div className="section-title">
                <span className="section-title-left">
                  <Video size={20} />
                  Today's Live Session
                </span>
              </div>

              <h3>React Authentication using JWT</h3>

              <p>Join today's scheduled live lecture.</p>

              <div className="session-time">
                <Clock3 size={16} />
                Today • 2:00 PM - 3:00 PM
              </div>


              {isStudent && (
                <button className="join-btn" onClick={handleJoinSession}>
                  Join Session
                  <ArrowRight size={18} />
                </button>
              )}

              {isTeacher && (
                <button className="join-btn" onClick={handleStartSession}>
                  Go Live Now
                  <ArrowRight size={18} />
                </button>
              )}
            </div>



            <div className="section-card">
              <div className="section-title">
                <span className="section-title-left">
                  <Bell size={20} />
                  Announcements
                </span>
                {isTeacher && (
                  <button
                    className="inline-add-btn"
                    onClick={handlePostAnnouncement}
                    title="Post Announcement"
                  >
                    <Plus size={18} />
                    New
                  </button>
                )}
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

          </div>



          <div className="right-section">


            <div className="section-card">
              <div className="section-title">
                <span className="section-title-left">
                  <Users size={20} />
                  Students
                </span>
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


                      {isTeacher && (
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveStudent(student._id)}
                          title="Remove student"
                          aria-label={`Remove ${student.name} from classroom`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>



            <div className="section-card">
              <div className="section-title">
                <span className="section-title-left">
                  <PlayCircle size={20} />
                  Recordings
                </span>
                {isTeacher && (
                  <button
                    className="inline-add-btn"
                    onClick={handleUploadRecording}
                    title="Upload Recording"
                  >
                    <UploadCloud size={16} />
                    Upload
                  </button>
                )}
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
