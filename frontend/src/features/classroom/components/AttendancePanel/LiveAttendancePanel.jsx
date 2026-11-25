import { useEffect, useState } from "react";
import { X, Users } from "lucide-react";
import { getLiveSessionAttendance } from "../../api/attendance.api";

const POLL_INTERVAL_MS = 20000;

export default function LiveAttendancePanel({ sessionId, onClose }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    const load = async () => {
      try {
        const data = await getLiveSessionAttendance(sessionId);
        if (!cancelled) {
          setRows(data.attendance || []);
          setError("");
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Unable to load live attendance.");
      }
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  return (
    <div className="w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Users size={16} />
          Live Attendance
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          data-tooltip="Close Panel"
          title="Close live attendance panel"
          aria-label="Close live attendance panel"
        >
          <X size={16} />
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {!error && rows.length === 0 && (
        <p className="text-xs text-slate-500">No students connected yet.</p>
      )}

      {!error && rows.length > 0 && (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {rows.map((row) => (
            <div
              key={row.studentId}
              className="rounded-xl border border-slate-100 p-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">{row.name}</span>
                <span
                  className={
                    row.connectionStatus === "Connected"
                      ? "text-green-600"
                      : row.connectionStatus === "Reconnecting"
                        ? "text-amber-600"
                        : "text-red-600"
                  }
                >
                  {row.connectionStatus}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-slate-500">
                <span>{Math.round(row.timePresentSoFar / 60)} min</span>
                <span>{row.currentPercentage}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
