import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Video,
  Users,
  CalendarDays,
  PlayCircle,
  ArrowRight,
  GraduationCap,
  Clock3,
  Plus,
  Trash2,
  UploadCloud,
  Pencil,
  Play,
  Loader2,
  X,
  Megaphone,
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
import { getClassroomAttendance, getMyAttendance } from "../../api/attendance.api";
import { useNavigate } from "react-router-dom";
import { createSession, startSession, endSession, getSessionsByClassroom } from "../../../auth/api/session.api";
import usePageMeta from "../../../../hooks/usePageMeta";
import StatCard from "../../../dashboard/components/StatCard/StatCard";

import UserAvatar from "../../../../components/UserAvatar/UserAvatar";
import { buildUserColorMap } from "../../../../utils/avatar";

function ClassroomDetails() {
  const { classroomId } = useParams();

  const [classroom, setClassroom] = useState(() => {
    try {
      const cached = sessionStorage.getItem(`cached_classroom_${classroomId}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  usePageMeta(classroom?.name || "Classroom");
  const [loading, setLoading] = useState(!classroom);
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

  const [attendancePercentage, setAttendancePercentage] = useState(null);

  useEffect(() => {
    fetchClassroom();
    fetchAnnouncements();
    fetchRecordings();
    fetchLiveSession();
    fetchAttendance();

    const interval = setInterval(fetchLiveSession, 8000);
    return () => clearInterval(interval);
  }, [classroomId]);

  const fetchAttendance = async () => {
    try {
      if (isTeacher) {
        const res = await getClassroomAttendance(classroomId);
        const list = res?.attendance || [];
        if (list.length > 0) {
          const total = list.reduce(
            (sum, s) => sum + (Number(s.attendancePercentage) || 0),
            0
          );
          setAttendancePercentage(Math.round(total / list.length));
        } else {
          setAttendancePercentage(0);
        }
      } else {
        const res = await getMyAttendance();
        const list = (res?.attendance || []).filter(
          (r) =>
            r.classroom?._id === classroomId ||
            r.classroom === classroomId ||
            r.classroom?.name === classroom?.name
        );
        if (list.length > 0) {
          const total = list.reduce(
            (sum, r) => sum + (Number(r.attendancePercentage) || 0),
            0
          );
          setAttendancePercentage(Math.round(total / list.length));
        } else {
          setAttendancePercentage(0);
        }
      }
    } catch (err) {
      console.error("Could not load classroom attendance:", err);
      setAttendancePercentage(0);
    }
  };

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
      sessionStorage.setItem(
        `cached_classroom_${classroomId}`,
        JSON.stringify(data)
      );
    } catch (err) {
      console.error(err);
      if (!classroom) {
        setError("Unable to load classroom.");
      }
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

  if (loading && !classroom) {
    return (
      <div className="classroom-detail-page p-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-44 w-full rounded-2xl bg-white p-6 shadow-sm border border-gray-100 mb-6 space-y-4">
          <div className="h-7 w-64 rounded bg-gray-200" />
          <div className="h-4 w-40 rounded bg-gray-100" />
          <div className="h-10 w-48 rounded-xl bg-gray-200" />
        </div>
        <div className="h-12 w-full rounded-xl bg-gray-100 mb-6" />
        <div className="h-64 w-full rounded-2xl bg-white p-6 shadow-sm border border-gray-100" />
      </div>
    );
  }

  if (error && !classroom) {
    return <div className="classroom-error">{error}</div>;
  }

  if (!classroom) {
    return <div className="classroom-error">Classroom not found.</div>;
  }

  const handleStartSession = async () => {
    try {
      setStartingSession(true);

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

  const userColorMap = useMemo(() => {
    const participants = [];
    if (classroom?.teacher) {
      participants.push(classroom.teacher);
    }
    if (Array.isArray(classroom?.students)) {
      participants.push(...classroom.students);
    }
    return buildUserColorMap(participants);
  }, [classroom?.teacher, classroom?.students]);

  const teacherKey = String(
    classroom?.teacher?._id ||
    classroom?.teacher?.id ||
    classroom?.teacher?.email ||
    classroom?.teacher?.name ||
    "teacher"
  );
  const teacherColor = userColorMap.get(teacherKey);

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
              {classroom.teacher && (
                <span className="meta-chip flex items-center gap-1.5">
                  <UserAvatar
                    id={teacherKey}
                    name={classroom.teacher.name}
                    colorClass={teacherColor}
                    size="xs"
                    className="!w-5 !h-5 !text-[10px]"
                  />
                  <span>Teacher: {classroom.teacher.name}</span>
                </span>
              )}
              {liveSession ? (
                <span className="meta-chip bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
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
              className="live-btn bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center gap-2 border-none"
              onClick={handleJoinOrRejoinSession}
              data-tooltip="Rejoin active"
              title="Rejoin Live Session"
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
              data-tooltip="Launch live"
              title="Start Live Session"
            >
              <Video size={18} />
              {startingSession ? "Starting..." : "Start Live Session"}
            </button>
          )}

          {isStudent && liveSession && (
            <button
              className="live-btn bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center gap-2 border-none"
              onClick={handleJoinOrRejoinSession}
              data-tooltip="Join active live"
              title="Join Live Session"
            >
              <Video size={18} />
              Join Live Session
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
              value={`${attendancePercentage ?? 0}%`}
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
                    data-tooltip="Edit title"
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
                  <button
                    className="join-btn"
                    onClick={handleJoinOrRejoinSession}
                    data-tooltip={liveSession ? "Join Session" : "Enter Class"}
                    title="Join Session"
                  >
                    {liveSession ? "Join Live Session" : "Join Session"}
                    <ArrowRight size={18} />
                  </button>
                )}

                {isTeacher && liveSession && (
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <button
                      className="join-btn bg-emerald-600 hover:bg-emerald-700 font-semibold shadow"
                      onClick={handleJoinOrRejoinSession}
                      data-tooltip="Rejoin active"
                      title="Rejoin Live Session"
                    >
                      Rejoin Live Session
                      <ArrowRight size={18} />
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-500 hover:text-red-700 hover:underline text-center"
                      onClick={handleEndLiveSessionFromClassroom}
                      data-tooltip="End finalize"
                      title="End session for all students"
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
                    data-tooltip="Launch instant"
                    title="Go Live Now"
                  >
                    {startingSession ? "Starting..." : "Go Live Now"}
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="section-card announcements-card">
              <div className="section-title">
                <span className="section-title-left">
                  <Megaphone size={19} />
                  Announcements
                </span>
                {isTeacher && (
                  <button
                    className="inline-add-btn"
                    onClick={handlePostAnnouncement}
                    data-tooltip="Post new"
                    title="Post Announcement"
                  >
                    <Plus size={16} />
                    New
                  </button>
                )}
              </div>

              <div className="announcements-list">
                {announcements.length === 0 ? (
                  <div className="empty-box">
                    <p className="empty-text">No announcements available.</p>
                  </div>
                ) : (
                  announcements.map((item) => (
                    <div key={item._id} className="announcement-item py-2 shrink-0">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 mt-0.5">
                            <Megaphone size={15} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-slate-800 truncate" title={item.title}>
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {isTeacher && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              className="edit-icon-btn p-1"
                              onClick={() => handleOpenEditAnnouncement(item)}
                              data-tooltip="Edit Announcement"
                              title="Edit announcement"
                              aria-label="Edit announcement"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="edit-icon-btn p-1 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteAnnouncement(item._id)}
                              disabled={deletingAnnouncementId === item._id}
                              data-tooltip="Permanently delete"
                              title="Delete announcement"
                              aria-label="Delete announcement"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="section-card recordings-card">
              <div className="section-title">
                <span className="section-title-left">
                  <PlayCircle size={19} />
                  Recordings
                </span>
                {isTeacher && (
                  <button
                    className="inline-add-btn"
                    onClick={handleOpenUploadRecording}
                    data-tooltip="Upload recorded"
                    title="Upload Recording"
                  >
                    <UploadCloud size={15} />
                    Upload
                  </button>
                )}
              </div>

              <div className="recordings-list">
                {loadingRecordings ? (
                  <div className="empty-box">
                    <p className="empty-text">Loading recordings...</p>
                  </div>
                ) : recordings.length === 0 ? (
                  <div className="empty-box">
                    <p className="empty-text">No recordings found.</p>
                  </div>
                ) : (
                  recordings.map((video) => (
                    <div
                      key={video._id}
                      className="recording-row flex items-center justify-between gap-2.5 py-2 shrink-0"
                    >
                      <div
                        className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                        onClick={() => setWatchingRecording(video)}
                        title="Click to watch recording"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                          <Play size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-slate-800 truncate hover:text-indigo-600 transition-colors" title={video.title}>
                            {video.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 truncate">
                            {video.description || "Recorded Lecture"} •{" "}
                            {new Date(video.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="watch-btn text-xs px-2.5 py-1"
                          onClick={() => setWatchingRecording(video)}
                          data-tooltip="Watch Recording"
                          title="Watch Recording"
                        >
                          Watch
                        </button>
                        {isTeacher && (
                          <button
                            className="edit-icon-btn p-1 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() =>
                              handleDeleteRecording(video._id, video.title)
                            }
                            disabled={deletingRecordingId === video._id}
                            data-tooltip="Delete recorded"
                            title="Delete recording"
                            aria-label="Delete recording"
                          >
                            {deletingRecordingId === video._id ? (
                              <Loader2
                                size={14}
                                className="animate-spin text-red-600"
                              />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          <div className="right-section">
            {classroom.teacher && (
              <div className="section-card">
                <div className="section-title">
                  <span className="section-title-left">
                    <GraduationCap size={20} />
                    Teacher
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                    Host
                  </span>
                </div>

                <div className="student-row !border-none !py-1">
                  <div className="student-left">
                    <UserAvatar
                      id={teacherKey}
                      name={classroom.teacher.name}
                      colorClass={teacherColor}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <h4>{classroom.teacher.name}</h4>
                      <p>{classroom.teacher.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="section-card">
              <div className="section-title">
                <span className="section-title-left">
                  <Users size={20} />
                  Students
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {students.length}
                </span>
              </div>

              {students.length === 0 ? (
                <p className="empty-text">No students joined.</p>
              ) : (
                <div className="students-list">
                  {students.map((student, index) => {
                    const studentKey = String(
                      student._id ||
                      student.id ||
                      student.email ||
                      student.name ||
                      `student-${index}`
                    );
                    const studentColor = userColorMap.get(studentKey);
                    return (
                      <div key={student._id || index} className="student-row">
                        <div className="student-left">
                          <UserAvatar
                            id={studentKey}
                            name={student.name}
                            colorClass={studentColor}
                            size="md"
                          />

                          <div className="min-w-0 flex-1">
                            <h4>{student.name}</h4>
                            <p>{student.email}</p>
                          </div>
                        </div>

                        {isTeacher && (
                          <button
                            className="remove-btn"
                            onClick={() => handleRemoveStudent(student._id)}
                            data-tooltip="Remove student"
                            title="Remove student"
                            aria-label={`Remove ${student.name} from classroom`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
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
                  data-tooltip="Close modal"
                  title="Close"
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
                data-tooltip="Save updated"
                title="Save"
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
                <h2 className="modal-title flex items-center gap-2">
                  <Megaphone size={18} className="text-indigo-600" />
                  Post Announcement
                </h2>
                <button
                  onClick={() => setShowAddAnnouncement(false)}
                  data-tooltip="Close modal"
                  title="Close"
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
                data-tooltip="Publish announcement"
                title="Post"
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
                <h2 className="modal-title flex items-center gap-2">
                  <Megaphone size={18} className="text-indigo-600" />
                  Edit Announcement
                </h2>
                <button
                  onClick={() => setShowEditAnnouncement(false)}
                  data-tooltip="Close modal"
                  title="Close"
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
                data-tooltip="Save changes"
                title="Save Changes"
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
                  data-tooltip="Close modal"
                  title="Close"
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
                  data-tooltip="Upload recorded"
                  title="Upload Recording"
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
                  data-tooltip="Close Player"
                  title="Close"
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
