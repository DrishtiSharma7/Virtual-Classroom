import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Video,
  Upload,
  X,
  Play,
  Trash2,
  Loader2,
  Film,
  LayoutGrid,
} from "lucide-react";

import "./RecordingsHome.css";
import StatCard from "../../../dashboard/components/StatCard/StatCard";
import { getMyClassrooms } from "../../api/classroom.api";
import {
  getClassroomRecordings,
  uploadRecording,
  deleteRecording,
  getRecordingUrl,
} from "../../api/recording.api";

export default function TeacherRecordingsHome() {
  const [searchParams] = useSearchParams();
  const autoOpenedRef = useRef(false);

  const [classrooms, setClassrooms] = useState([]);
  const [classroomId, setClassroomId] = useState("");
  const [recordings, setRecordings] = useState([]);

  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingRecordings, setLoadingRecordings] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const [watching, setWatching] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyClassrooms();
        setClassrooms(data);
        const preselect = searchParams.get("classroomId");
        const match = preselect && data.find((c) => c._id === preselect);
        if (match) {
          setClassroomId(match._id);
        } else if (data.length > 0) {
          setClassroomId(data[0]._id);
        }
      } catch {
        toast.error("Could not load your classrooms.");
      } finally {
        setLoadingClassrooms(false);
      }
    })();
  }, []);

  const loadRecordings = async (id) => {
    setLoadingRecordings(true);
    try {
      const data = await getClassroomRecordings(id);
      setRecordings(data);
    } catch {
      toast.error("Could not load recordings for this classroom.");
    } finally {
      setLoadingRecordings(false);
    }
  };

  useEffect(() => {
    if (!classroomId) return;
    (async () => {
      await loadRecordings(classroomId);
    })();
  }, [classroomId]);

  const openUpload = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setUploadError("");
    setShowUpload(true);
  };

  useEffect(() => {
    if (
      classroomId &&
      searchParams.get("upload") === "1" &&
      !autoOpenedRef.current
    ) {
      autoOpenedRef.current = true;
      openUpload();
    }
  }, [classroomId]);

  const handleUpload = async () => {
    if (!title.trim()) {
      setUploadError("Give this recording a title.");
      return;
    }
    if (!file) {
      setUploadError("Choose a video file to upload.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");

      const formData = new FormData();
      formData.append("classroom", classroomId);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("file", file);

      await uploadRecording(formData);

      toast.success("Recording uploaded.");
      setShowUpload(false);
      loadRecordings(classroomId);
    } catch (err) {
      setUploadError(
        err?.response?.data?.message || "Could not upload the recording."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (recording) => {
    if (!window.confirm(`Delete "${recording.title}"?`)) return;

    try {
      setDeletingId(recording._id);
      await deleteRecording(recording._id);
      setRecordings((prev) => prev.filter((r) => r._id !== recording._id));
      toast.success("Recording deleted.");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Could not delete recording."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="recordings-page">
      <div className="recordings-container">
        <div className="recordings-header">
          <div>
            <h1 className="recordings-title">
              <Video className="text-indigo-600" size={26} />
              Recordings
            </h1>
            <p className="recordings-subtitle">
              Upload recorded lectures so students can watch them anytime.
            </p>
          </div>

          <div className="header-buttons">
            <button
              onClick={openUpload}
              disabled={loadingClassrooms || classrooms.length === 0}
              className="export-btn"
            >
              <Upload size={18} /> Upload Recording
            </button>
          </div>
        </div>

        {loadingClassrooms ? (
          <p className="loading-text">Loading classrooms...</p>
        ) : classrooms.length === 0 ? (
          <div className="no-data">
            You don't have any classrooms yet. Create one to start uploading
            recordings.
          </div>
        ) : (
          <>
            <div className="filter-card">
              <label className="filter-label">Classroom</label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="classroom-select"
              >
                {classrooms.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {c.subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="recordings-stats-grid">
              <StatCard
                icon={<Film />}
                label="Total Recordings"
                value={recordings.length}
                colorClass="bg-blue-soft"
              />
              <StatCard
                icon={<LayoutGrid />}
                label="Classrooms"
                value={classrooms.length}
                colorClass="bg-purple-soft"
              />
            </div>

            {loadingRecordings ? (
              <p className="loading-text">Loading recordings...</p>
            ) : recordings.length === 0 ? (
              <div className="no-data">
                No recordings uploaded for this classroom yet.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="recordings-table">
                  <thead className="table-head">
                    <tr>
                      <th className="table-heading">Title</th>
                      <th className="table-heading">Uploaded By</th>
                      <th className="table-heading">Uploaded</th>
                      <th className="table-heading text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordings.map((r) => (
                      <tr key={r._id} className="table-row">
                        <td className="table-cell">
                          <p className="entity-name">{r.title}</p>
                          {r.description && (
                            <p className="text-xs text-gray-500">
                              {r.description}
                            </p>
                          )}
                        </td>
                        <td className="table-cell">
                          {r.uploadedBy?.name || "—"}
                        </td>
                        <td className="table-cell">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="table-cell">
                          <div className="action-buttons">
                            <button
                              onClick={() => setWatching(r)}
                              title="Watch recording"
                              className="view-btn"
                            >
                              <Play size={18} className="view-icon" />
                            </button>
                            <button
                              onClick={() => handleDelete(r)}
                              disabled={deletingId === r._id}
                              title="Delete recording"
                              className="delete-btn"
                            >
                              {deletingId === r._id ? (
                                <Loader2
                                  size={18}
                                  className="animate-spin text-red-600"
                                />
                              ) : (
                                <Trash2 size={18} className="delete-icon" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {showUpload && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h2 className="modal-title">Upload Recording</h2>
                <button
                  onClick={() => setShowUpload(false)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              {uploadError && <p className="form-error">{uploadError}</p>}

              <div className="form-field">
                <label className="form-label">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Week 3 — React Hooks"
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Description (optional)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this session cover?"
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Video file</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="form-input"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="export-btn w-full justify-center"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />{" "}
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </button>
            </div>
          </div>
        )}

        {watching && (
          <div className="modal-overlay" onClick={() => setWatching(null)}>
            <div
              className="modal-card-wide"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">{watching.title}</h2>
                <button
                  onClick={() => setWatching(null)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              <video
                key={watching._id}
                src={getRecordingUrl(watching.fileUrl)}
                controls
                autoPlay
                className="w-full rounded-xl bg-black"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
