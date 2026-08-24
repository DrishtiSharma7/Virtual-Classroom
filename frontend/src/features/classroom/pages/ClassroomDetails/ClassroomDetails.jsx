import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Video,
  Users,
  CalendarDays,
  PlayCircle,
  ArrowRight,
  UserCircle2,
  Clock3,
  Plus,
  Trash2,
  UploadCloud,
  Pencil,
  X,
} from "lucide-react";

import "./ClassroomDetails.css";
import { getClassroomById, updateClassroom } from "../../api/classroom.api";
import {
  createAnnouncement,
  getClassroomAnnouncements,
} from "../../api/announcement.api";
import { useNavigate } from "react-router-dom";
import { createSession, startSession, getSessionsByClassroom } from "../../../auth/api/session.api";
import usePageMeta from "../../../../hooks/usePageMeta";
import StatCard from "../../../dashboard/components/StatCard/StatCard";

function ClassroomDetails() {
  const { classroomId } = useParams();

  const [classroom, setClassroom] = useState(null);
  usePageMeta(classroom?.name || "Classroom");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [startingSession, setStartingSession] = useState(false);

  const [showEditSession, setShowEditSession] = useState(false);
  const [sessionTitleInput, setSessionTitleInput] = useState("");
  const [savingSessionTitle, setSavingSessionTitle] = useState(false);
  const [sessionTitleError, setSessionTitleError] = useState("");

  const [announcements, setAnnouncements] = useState([]);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementDescription, setAnnouncementDescription] = useState("");
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;
  const isTeacher = role === "teacher";
  const isStudent = role === "student";
  useEffect(() => {
    fetchClassroom();
    fetchAnnouncements();
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

  const fetchAnnouncements = async () => {
    try {
      const data = await getClassroomAnnouncements(classroomId);
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
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
    setAnnouncementTitle("");
    setAnnouncementDescription("");
    setAnnouncementError("");
    setShowAddAnnouncement(true);
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim()) {
      setAnnouncementError("Give this announcement a title.");
      return;
    }
    try {
      setPostingAnnouncement(true);
      setAnnouncementError("");
      const res = await createAnnouncement({
        classroom: classroom._id,
        title: announcementTitle.trim(),
        description: announcementDescription.trim(),
      });
      setAnnouncements((prev) => [res.announcement, ...prev]);
      setShowAddAnnouncement(false);
      toast.success("Announcement posted.");
    } catch (err) {
      console.error(err);
      setAnnouncementError(
        err.response?.data?.message || "Unable to post announcement.",
      );
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const handleUploadRecording = () => {
    navigate(`/recordings?classroomId=${classroom._id}&upload=1`);
  };

  const handleRemoveStudent = (studentId) => {
    if (!window.confirm("Remove this student from the classroom?"))
      return;
    console.log("Remove student:", studentId);
  };

  const handleOpenEditSession = () => {
    setSessionTitleInput(sessionTitle);
    setSessionTitleError("");
    setShowEditSession(true);
  };

  const handleSaveSessionTitle = async () => {
    if (!sessionTitleInput.trim()) {
      setSessionTitleError("Session title cannot be empty.");
      return;
    }
    try {
      setSavingSessionTitle(true);
      setSessionTitleError("");
      const res = await updateClassroom(classroom._id, {
        sessionTitle: sessionTitleInput.trim(),
      });
      setClassroom(res.classroom);
      setShowEditSession(false);
      toast.success("Session title updated.");
    } catch (err) {
      console.error(err);
      setSessionTitleError(
        err.response?.data?.message || "Unable to update session title.",
      );
    } finally {
      setSavingSessionTitle(false);
    }
  };

  const students = classroom.students || [];
  const recordings = classroom.recordings || [];
  const sessionTitle = classroom.sessionTitle?.trim()
    ? classroom.sessionTitle
    : `${classroom.subject} Live Session`;

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



        <div className="classroom-details-stats-grid">
          <StatCard
            icon={<Users size={22} />}
            label="Total Students"
            value={students.length}
            colorClass="bg-blue-soft"
          />

          <Link to={`/attendance/${classroom._id}`} className="block">
            <StatCard
              icon={<CalendarDays size={22} />}
              label={isTeacher ? "Attendance" : "My Attendance"}
              value="91%"
              colorClass="bg-green-soft"
            />
          </Link>

          <StatCard
            icon={<PlayCircle size={22} />}
            label="Recordings"
            value={recordings.length}
            colorClass="bg-purple-soft"
          />
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

              <div className="session-title-row">
                <h3>{sessionTitle}</h3>
                {isTeacher && (
                  <button
                    className="edit-icon-btn"
                    onClick={handleOpenEditSession}
                    title="Edit session title"
                    aria-label="Edit session title"
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </div>

              <p>Join today's scheduled live lecture.</p>

              <div className="session-footer">
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
            </div>



            <div className="section-card">
              <div className="section-title">
                <span className="section-title-left">
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
                announcements.map((item) => (
                  <div key={item._id} className="announcement-item">
                    <h4>{item.title}</h4>

                    {item.description && <p>{item.description}</p>}
                  </div>
                ))
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
          </div>
        </div>

        {showEditSession && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h2 className="modal-title">Edit Session Title</h2>
                <button
                  onClick={() => setShowEditSession(false)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              {sessionTitleError && (
                <p className="form-error">{sessionTitleError}</p>
              )}

              <div className="form-field">
                <label className="form-label">Session Title</label>
                <input
                  value={sessionTitleInput}
                  onChange={(e) => setSessionTitleInput(e.target.value)}
                  placeholder={`e.g. ${classroom.subject} Live Session`}
                  className="form-input"
                />
              </div>

              <button
                onClick={handleSaveSessionTitle}
                disabled={savingSessionTitle}
                className="join-btn mt-6 w-full justify-center"
              >
                {savingSessionTitle ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {showAddAnnouncement && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h2 className="modal-title">Post Announcement</h2>
                <button
                  onClick={() => setShowAddAnnouncement(false)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              {announcementError && (
                <p className="form-error">{announcementError}</p>
              )}

              <div className="form-field">
                <label className="form-label">Title</label>
                <input
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="e.g. Class rescheduled to 4 PM"
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Description (optional)</label>
                <input
                  value={announcementDescription}
                  onChange={(e) => setAnnouncementDescription(e.target.value)}
                  placeholder="Add more details..."
                  className="form-input"
                />
              </div>

              <button
                onClick={handleCreateAnnouncement}
                disabled={postingAnnouncement}
                className="join-btn mt-6 w-full justify-center"
              >
                {postingAnnouncement ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassroomDetails;
