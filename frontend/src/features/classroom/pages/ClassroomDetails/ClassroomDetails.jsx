import { useEffect, useState, useRef } from "react";
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
  Play,
  Loader2,
  X,
} from "lucide-react";

import "./ClassroomDetails.css";
import { getClassroomById, updateClassroom } from "../../api/classroom.api";
import {
  createAnnouncement,
  getClassroomAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../api/announcement.api";
import {
  uploadRecording,
  deleteRecording,
  getClassroomRecordings,
  getRecordingUrl,
} from "../../api/recording.api";
import { useNavigate } from "react-router-dom";
import { createSession, startSession, endSession, getSessionsByClassroom } from "../../../auth/api/session.api";
import usePageMeta from "../../../../hooks/usePageMeta";
import StatCard from "../../../dashboard/components/StatCard/StatCard";

function ClassroomDetails() {
  const { classroomId } = useParams();

  const [classroom, setClassroom] = useState(null);
  usePageMeta(classroom?.name || "Classroom");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [liveSession, setLiveSession] = useState(null);
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

  const [showEditAnnouncement, setShowEditAnnouncement] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [editAnnouncementTitle, setEditAnnouncementTitle] = useState("");
  const [editAnnouncementDescription, setEditAnnouncementDescription] = useState("");
  const [updatingAnnouncement, setUpdatingAnnouncement] = useState(false);
  const [editAnnouncementError, setEditAnnouncementError] = useState("");
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState(null);

  const [recordings, setRecordings] = useState([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [showUploadRecording, setShowUploadRecording] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingDescription, setRecordingDescription] = useState("");
  const [recordingFile, setRecordingFile] = useState(null);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [recordingUploadError, setRecordingUploadError] = useState("");
  const [watchingRecording, setWatchingRecording] = useState(null);
  const [deletingRecordingId, setDeletingRecordingId] = useState(null);
  const recordingFileInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;
  const isTeacher = role === "teacher";
  const isStudent = role === "student";
  useEffect(() => {
    fetchClassroom();
    fetchAnnouncements();
    fetchRecordings();
    fetchLiveSession();

    // Periodically poll for live session status (every 8 seconds)
    const interval = setInterval(fetchLiveSession, 8000);
    return () => clearInterval(interval);
  }, [classroomId]);

  const fetchLiveSession = async () => {
    try {
      const res = await getSessionsByClassroom(classroomId);
      const active = res.data?.find((s) => s.status === "live");
      setLiveSession(active || null);
    } catch (err) {
      console.error("Could not fetch active live session:", err);
    }
  };

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

  const fetchRecordings = async () => {
    try {
      setLoadingRecordings(true);
      const data = await getClassroomRecordings(classroomId);
      setRecordings(data);
    } catch (err) {
      console.error("Could not load recordings:", err);
    } finally {
      setLoadingRecordings(false);
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

      // Check if there is already an active live session running
      const res = await getSessionsByClassroom(classroom._id);
      const existingLive = res.data?.find((s) => s.status === "live");

      if (existingLive) {
        setLiveSession(existingLive);
        toast.success("Rejoining ongoing live session...");
        navigate(`/live/${existingLive._id}`);
        return;
      }

      const createRes = await createSession({
        classroom: classroom._id,
        title: sessionTitleInput.trim() || `${classroom.subject} Live Session`,
        description: `Live class for ${classroom.name}`,
        startTime: new Date(),
      });

      const session = createRes.data.session;

      if (!createRes.data.alreadyLive) {
        await startSession(session._id);
      }

      navigate(`/live/${session._id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Unable to start session.");
    } finally {
      setStartingSession(false);
    }
  };

  const handleJoinOrRejoinSession = async () => {
    if (liveSession) {
      navigate(`/live/${liveSession._id}`);
      return;
    }

    try {
      const res = await getSessionsByClassroom(classroom._id);
      const active = res.data?.find((s) => s.status === "live");

      if (!active) {
        toast.error("No live session running right now.");
        return;
      }

      setLiveSession(active);
      navigate(`/live/${active._id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Unable to join session.");
    }
  };

  const handleEndLiveSessionFromClassroom = async () => {
    if (!liveSession) return;
    const confirmEnd = window.confirm(
      "Are you sure you want to end this live session for all students?"
    );
    if (!confirmEnd) return;

    try {
      await endSession(liveSession._id);
      setLiveSession(null);
      toast.success("Live session ended successfully.");
    } catch (err) {
      console.error("Failed to end session:", err);
      toast.error(err.response?.data?.message || "Failed to end session.");
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

  const handleOpenEditAnnouncement = (item) => {
    setEditingAnnouncementId(item._id);
    setEditAnnouncementTitle(item.title || "");
    setEditAnnouncementDescription(item.description || "");
    setEditAnnouncementError("");
    setShowEditAnnouncement(true);
  };

  const handleUpdateAnnouncement = async () => {
    if (!editAnnouncementTitle.trim()) {
      setEditAnnouncementError("Give this announcement a title.");
      return;
    }
    try {
      setUpdatingAnnouncement(true);
      setEditAnnouncementError("");
      const res = await updateAnnouncement(editingAnnouncementId, {
        title: editAnnouncementTitle.trim(),
        description: editAnnouncementDescription.trim(),
      });
      setAnnouncements((prev) =>
        prev.map((a) =>
          a._id === editingAnnouncementId ? res.announcement : a
        )
      );
      setShowEditAnnouncement(false);
      toast.success("Announcement updated.");
    } catch (err) {
      console.error(err);
      setEditAnnouncementError(
        err.response?.data?.message || "Unable to update announcement."
      );
    } finally {
      setUpdatingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm("Are you sure you want to delete this announcement?"))
      return;
    try {
      setDeletingAnnouncementId(announcementId);
      await deleteAnnouncement(announcementId);
      setAnnouncements((prev) =>
        prev.filter((a) => a._id !== announcementId)
      );
      toast.success("Announcement deleted.");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Unable to delete announcement."
      );
    } finally {
      setDeletingAnnouncementId(null);
    }
  };

  const handleOpenUploadRecording = () => {
    setRecordingTitle("");
    setRecordingDescription("");
    setRecordingFile(null);
    setRecordingUploadError("");
    if (recordingFileInputRef.current) {
      recordingFileInputRef.current.value = "";
    }
    setShowUploadRecording(true);
  };

  const handleUploadRecordingSubmit = async (e) => {
    e.preventDefault();
    if (!recordingTitle.trim()) {
      setRecordingUploadError("Please provide a title for this recording.");
      return;
    }
    if (!recordingFile) {
      setRecordingUploadError("Please choose a video file to upload.");
      return;
    }

    try {
      setUploadingRecording(true);
      setRecordingUploadError("");

      const formData = new FormData();
      formData.append("classroom", classroomId);
      formData.append("title", recordingTitle.trim());
      formData.append("description", recordingDescription.trim());
      formData.append("file", recordingFile);

      const res = await uploadRecording(formData);
      setRecordings((prev) => [res.recording, ...prev]);
      setShowUploadRecording(false);
      toast.success("Recording uploaded successfully!");
    } catch (err) {
      console.error(err);
      setRecordingUploadError(
        err.response?.data?.message || "Failed to upload recording."
      );
    } finally {
      setUploadingRecording(false);
    }
  };

  const handleDeleteRecording = async (recordingId, title) => {
    if (!window.confirm(`Delete recording "${title}"?`)) return;
    try {
      setDeletingRecordingId(recordingId);
      await deleteRecording(recordingId);
      setRecordings((prev) => prev.filter((r) => r._id !== recordingId));
      toast.success("Recording deleted.");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to delete recording."
      );
    } finally {
      setDeletingRecordingId(null);
    }
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
              {liveSession ? (
                <span className="meta-chip bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1.5 border border-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live Session Running
                </span>
              ) : (
                <span className="meta-chip active">Active</span>
              )}
            </div>
          </div>

          {isTeacher && liveSession && (
            <button
              className="live-btn bg-emerald-600 hover:bg-emerald-700 shadow-lg flex items-center gap-2"
              onClick={handleJoinOrRejoinSession}
            >
              <Video size={18} />
              Rejoin Live Session
            </button>
          )}

          {isTeacher && !liveSession && (
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
                {liveSession && (
                  <span className="ml-auto text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Live Now
                  </span>
                )}
              </div>

              <div className="session-title-row">
                <h3>{liveSession ? liveSession.title : sessionTitle}</h3>
                {isTeacher && !liveSession && (
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

              <p>
                {liveSession
                  ? "Students are currently in this session. Rejoin to continue teaching."
                  : "Join today's scheduled live lecture."}
              </p>

              <div className="session-footer">
                <div className="session-time">
                  <Clock3 size={16} />
                  {liveSession
                    ? `Started at ${new Date(liveSession.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Today • 2:00 PM - 3:00 PM"}
                </div>

                {isStudent && (
                  <button className="join-btn" onClick={handleJoinOrRejoinSession}>
                    {liveSession ? "Join Live Session" : "Join Session"}
                    <ArrowRight size={18} />
                  </button>
                )}

                {isTeacher && liveSession && (
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <button
                      className="join-btn bg-emerald-600 hover:bg-emerald-700 font-semibold shadow"
                      onClick={handleJoinOrRejoinSession}
                    >
                      Rejoin Live Session
                      <ArrowRight size={18} />
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-500 hover:text-red-700 hover:underline text-center"
                      onClick={handleEndLiveSessionFromClassroom}
                    >
                      End session for all students
                    </button>
                  </div>
                )}

                {isTeacher && !liveSession && (
                  <button
                    className="join-btn"
                    onClick={handleStartSession}
                    disabled={startingSession}
                  >
                    {startingSession ? "Starting..." : "Go Live Now"}
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4>{item.title}</h4>
                        {item.description && <p>{item.description}</p>}
                      </div>
                      {isTeacher && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            className="edit-icon-btn"
                            onClick={() => handleOpenEditAnnouncement(item)}
                            title="Edit announcement"
                            aria-label="Edit announcement"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="edit-icon-btn text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteAnnouncement(item._id)}
                            disabled={deletingAnnouncementId === item._id}
                            title="Delete announcement"
                            aria-label="Delete announcement"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
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
                    onClick={handleOpenUploadRecording}
                    title="Upload Recording"
                  >
                    <UploadCloud size={16} />
                    Upload
                  </button>
                )}
              </div>

              {loadingRecordings ? (
                <p className="empty-text">Loading recordings...</p>
              ) : recordings.length === 0 ? (
                <p className="empty-text">No recordings found.</p>
              ) : (
                recordings.map((video) => (
                  <div
                    key={video._id}
                    className="recording-row flex items-center justify-between gap-3"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => setWatchingRecording(video)}
                      title="Click to watch recording"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                        <Play size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-800 truncate hover:text-indigo-600 transition-colors">
                          {video.title}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {video.description || "Recorded Lecture"} •{" "}
                          {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className="watch-btn"
                        onClick={() => setWatchingRecording(video)}
                      >
                        Watch
                      </button>
                      {isTeacher && (
                        <button
                          className="edit-icon-btn text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() =>
                            handleDeleteRecording(video._id, video.title)
                          }
                          disabled={deletingRecordingId === video._id}
                          title="Delete recording"
                          aria-label="Delete recording"
                        >
                          {deletingRecordingId === video._id ? (
                            <Loader2
                              size={15}
                              className="animate-spin text-red-600"
                            />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      )}
                    </div>
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

        {showEditAnnouncement && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h2 className="modal-title">Edit Announcement</h2>
                <button
                  onClick={() => setShowEditAnnouncement(false)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              {editAnnouncementError && (
                <p className="form-error">{editAnnouncementError}</p>
              )}

              <div className="form-field">
                <label className="form-label">Title</label>
                <input
                  value={editAnnouncementTitle}
                  onChange={(e) => setEditAnnouncementTitle(e.target.value)}
                  placeholder="e.g. Class rescheduled to 4 PM"
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Description (optional)</label>
                <input
                  value={editAnnouncementDescription}
                  onChange={(e) =>
                    setEditAnnouncementDescription(e.target.value)
                  }
                  placeholder="Add more details..."
                  className="form-input"
                />
              </div>

              <button
                onClick={handleUpdateAnnouncement}
                disabled={updatingAnnouncement}
                className="join-btn mt-6 w-full justify-center"
              >
                {updatingAnnouncement ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {showUploadRecording && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h2 className="modal-title">Upload Recording</h2>
                <button
                  onClick={() => setShowUploadRecording(false)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              {recordingUploadError && (
                <p className="form-error">{recordingUploadError}</p>
              )}

              <form onSubmit={handleUploadRecordingSubmit}>
                <div className="form-field">
                  <label className="form-label">Title</label>
                  <input
                    value={recordingTitle}
                    onChange={(e) => setRecordingTitle(e.target.value)}
                    placeholder="e.g. Week 4 — Introduction to React"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Description (optional)</label>
                  <input
                    value={recordingDescription}
                    onChange={(e) => setRecordingDescription(e.target.value)}
                    placeholder="Topics discussed in this lecture..."
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Video File</label>
                  <input
                    ref={recordingFileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) =>
                      setRecordingFile(e.target.files?.[0] || null)
                    }
                    className="form-input"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Supports MP4, WebM, MOV, AVI (up to 500MB)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={uploadingRecording}
                  className="join-btn mt-6 w-full justify-center"
                >
                  {uploadingRecording ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Uploading Video...</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={18} />
                      <span>Upload Recording</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {watchingRecording && (
          <div
            className="modal-overlay"
            onClick={() => setWatchingRecording(null)}
          >
            <div
              className="modal-card max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">{watchingRecording.title}</h2>
                  {watchingRecording.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {watchingRecording.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setWatchingRecording(null)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              <video
                key={watchingRecording._id}
                src={getRecordingUrl(watchingRecording.fileUrl)}
                controls
                autoPlay
                className="w-full rounded-xl bg-black max-h-[70vh]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassroomDetails;
