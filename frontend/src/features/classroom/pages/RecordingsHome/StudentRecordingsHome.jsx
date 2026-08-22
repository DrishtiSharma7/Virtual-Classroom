import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Video, Play, X, Film } from "lucide-react";

import "./RecordingsHome.css";
import { getMyClassrooms } from "../../api/classroom.api";
import {
  getClassroomRecordings,
  getRecordingUrl,
} from "../../api/recording.api";

export default function StudentRecordingsHome() {
  const [classrooms, setClassrooms] = useState([]);
  const [classroomId, setClassroomId] = useState("");
  const [recordings, setRecordings] = useState([]);

  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [watching, setWatching] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyClassrooms();
        setClassrooms(data);
        if (data.length > 0) setClassroomId(data[0]._id);
      } catch {
        toast.error("Could not load your classrooms.");
      } finally {
        setLoadingClassrooms(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!classroomId) return;

    (async () => {
      setLoadingRecordings(true);
      try {
        const data = await getClassroomRecordings(classroomId);
        setRecordings(data);
      } catch {
        toast.error("Could not load recordings for this classroom.");
      } finally {
        setLoadingRecordings(false);
      }
    })();
  }, [classroomId]);

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
              Catch up on lectures you missed, whenever you're ready.
            </p>
          </div>
        </div>

        {loadingClassrooms ? (
          <p className="loading-text">Loading classrooms...</p>
        ) : classrooms.length === 0 ? (
          <div className="no-data">
            You haven't joined a classroom yet. Join one to see its
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

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <Film className="stat-icon-indigo" size={24} />
                  <p className="stat-label">Total Recordings</p>
                </div>
                <h2 className="stat-value">{recordings.length}</h2>
              </div>
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
                      <th className="table-heading">Uploaded</th>
                      <th className="table-heading text-center">Watch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordings.map((r) => (
                      <tr
                        key={r._id}
                        className="table-row cursor-pointer"
                        onClick={() => setWatching(r)}
                      >
                        <td className="table-cell">
                          <p className="entity-name">{r.title}</p>
                          {r.description && (
                            <p className="text-xs text-gray-500">
                              {r.description}
                            </p>
                          )}
                        </td>
                        <td className="table-cell">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="table-cell text-center">
                          <Play
                            size={18}
                            className="inline-block text-indigo-600"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
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
