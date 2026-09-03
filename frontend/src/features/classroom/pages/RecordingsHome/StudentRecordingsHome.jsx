import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Video, Play, X, Film, LayoutGrid } from "lucide-react";

import "./RecordingsHome.css";
import StatCard from "../../../dashboard/components/StatCard/StatCard";
import { getMyClassrooms } from "../../api/classroom.api";
import {
  getClassroomRecordings,
  getRecordingUrl,
} from "../../api/recording.api";

export default function StudentRecordingsHome() {
  const [classrooms, setClassrooms] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_classrooms");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [classroomId, setClassroomId] = useState(() => classrooms[0]?._id || "");
  const [recordings, setRecordings] = useState([]);

  const [loadingClassrooms, setLoadingClassrooms] = useState(classrooms.length === 0);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [watching, setWatching] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyClassrooms();
        if (Array.isArray(data)) {
          setClassrooms(data);
          localStorage.setItem("cached_classrooms", JSON.stringify(data));
          if (!classroomId && data.length > 0) setClassroomId(data[0]._id);
        }
      } catch {
        if (classrooms.length === 0) {
          toast.error("Could not load your classrooms.");
        }
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
          <div className="animate-pulse space-y-3 p-4">
            <div className="h-10 w-64 bg-gray-200 rounded-xl" />
            <div className="h-28 w-full bg-gray-100 rounded-2xl" />
          </div>
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
              <div className="animate-pulse space-y-3 p-6 bg-white rounded-2xl border border-gray-100">
                <div className="h-8 w-full bg-gray-100 rounded-lg" />
                <div className="h-8 w-full bg-gray-100 rounded-lg" />
                <div className="h-8 w-full bg-gray-100 rounded-lg" />
              </div>
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
                  data-tooltip="Close Player"
                  title="Close"
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
