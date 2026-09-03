import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Search,
  Download,
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  CalendarCheck,
  Trash2,
} from "lucide-react";
import "./AttendanceHome.css";
import StatCard from "../../../dashboard/components/StatCard/StatCard";
import {
  getClassroomAttendance,
  getAttendanceDashboard,
  getMyAttendance,
} from "../../api/attendance.api";
import { getClassroomById } from "../../api/classroom.api";
import {
  exportTeacherAttendanceToExcel,
  exportMyAttendanceToExcel,
} from "../../utils/attendanceExcel";
import usePageMeta from "../../../../hooks/usePageMeta";

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0m";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

function AttendanceHome() {
  usePageMeta("Attendance");
  const { role, user } = useSelector((state) => state.auth);
  const isStudent = role === "student";
  const { id: classroomId } = useParams();
  const cacheKey = `cached_attendance_${isStudent ? "student" : "teacher"}_${classroomId || "all"}`;
  const [attendance, setAttendance] = useState(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(attendance.length === 0);
  const [error, setError] = useState("");
  const [classroomLabel, setClassroomLabel] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = isStudent ? 6 : 8;

  const filteredData = useMemo(() => {
    const q = search.toLowerCase();

    return attendance.filter((row) => {
      if (isStudent) {
        return (
          row.classroomName.toLowerCase().includes(q) ||
          row.sessionTitle.toLowerCase().includes(q)
        );
      }

      return (
        row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q)
      );
    });
  }, [attendance, search, isStudent]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalStudents = attendance.length;

  const presentCount = attendance.filter((a) => a.isPresent).length;
  const absentCount = totalStudents - presentCount;

  const presentSessions = attendance.reduce(
    (sum, s) => sum + (s.presentSessions || 0),
    0
  );

  const absentSessions = attendance.reduce(
    (sum, s) => sum + (s.absentSessions || 0),
    0
  );

  const attendancePercentage =
    totalStudents === 0
      ? "0.0"
      : (
          attendance.reduce((sum, s) => sum + (s.attendancePercentage || 0), 0) /
          totalStudents
        ).toFixed(1);

  const handleDelete = (key) => {
    if (!window.confirm("Delete attendance record?")) return;

    setAttendance((prev) => prev.filter((student) => student.key !== key));
  };

  const exportExcel = () => {
    if (filteredData.length === 0) return;

    if (isStudent) {
      exportMyAttendanceToExcel(filteredData, user?.name);
    } else {
      exportTeacherAttendanceToExcel(filteredData, classroomLabel);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);

    try {
      if (isStudent) {
        const data = await getMyAttendance();

        const normalized = (data.attendance || []).map((record) => ({
          key: record._id,
          classroomName: record.classroom?.name || "—",
          sessionTitle: record.session?.title || "—",
          sessionDate: record.session?.startTime || null,
          sessionDurationSeconds:
            record.session?.startTime && record.session?.endTime
              ? Math.max(
                  0,
                  Math.floor(
                    (new Date(record.session.endTime) -
                      new Date(record.session.startTime)) /
                      1000
                  )
                )
              : null,
          timeAttendedSeconds: record.duration || 0,
          attendancePercentage: record.attendancePercentage || 0,
          isPresent: !!record.isPresent,
        }));

        setAttendance(normalized);
        sessionStorage.setItem(cacheKey, JSON.stringify(normalized));
        return;
      }

      const data = classroomId
        ? await getClassroomAttendance(classroomId)
        : await getAttendanceDashboard();

      const classroomName = classroomId
        ? (await getClassroomById(classroomId)).name
        : null;

      setClassroomLabel(classroomName || "all-classrooms");

      const normalized = (data.attendance || []).map((student) => ({
        ...student,
        classroom: student.classroom || classroomName,
        key: student.id || student.studentId,
      }));

      setAttendance(normalized);
      sessionStorage.setItem(cacheKey, JSON.stringify(normalized));
    } catch (err) {
      console.error(err);
      if (attendance.length === 0) {
        setError("Failed to load attendance. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [classroomId, isStudent]);

  if (loading && attendance.length === 0) {
    return (
      <div className="attendance-page">
        <div className="attendance-container animate-pulse">
          <div className="h-10 w-64 bg-gray-200 rounded-xl mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="h-24 bg-white rounded-2xl shadow-sm border border-gray-100" />
            <div className="h-24 bg-white rounded-2xl shadow-sm border border-gray-100" />
            <div className="h-24 bg-white rounded-2xl shadow-sm border border-gray-100" />
          </div>
          <div className="h-64 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="h-8 bg-gray-100 rounded-lg w-full" />
            <div className="h-8 bg-gray-100 rounded-lg w-full" />
            <div className="h-8 bg-gray-100 rounded-lg w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error && attendance.length === 0) {
    return (
      <div className="attendance-page">
        <div className="attendance-container">
          <p role="alert" className="text-red-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (isStudent) {
    return (
      <div className="attendance-page">
        <div className="attendance-container">
          <div className="attendance-header">
            <div>
              <h1 className="attendance-title">
                <CalendarCheck className="text-indigo-600" size={26} />
                My Attendance
              </h1>
              <p className="attendance-subtitle">
                Your attendance record across every session.
              </p>
            </div>

            <div className="header-buttons">
              <button
                onClick={exportExcel}
                className="export-btn"
                disabled={filteredData.length === 0}
                data-tooltip="Export attendance records to Excel spreadsheet"
                title={
                  filteredData.length === 0
                    ? "No attendance to export yet"
                    : "Export the attendance shown below"
                }
              >
                <Download size={18} />
                Export Excel
              </button>
            </div>
          </div>

          <div className="attendance-stats-grid">
            <StatCard
              icon={<CalendarDays />}
              label="Total Sessions"
              value={totalStudents}
              colorClass="bg-blue-soft"
            />
            <StatCard
              icon={<UserCheck />}
              label="Present"
              value={presentCount}
              colorClass="bg-green-soft"
            />
            <StatCard
              icon={<UserX />}
              label="Absent"
              value={absentCount}
              colorClass="bg-orange-soft"
            />
            <StatCard
              icon={<CalendarCheck />}
              label="Attendance"
              value={`${attendancePercentage}%`}
              colorClass="bg-purple-soft"
            />
          </div>

          <div className="filter-card w-full block">
            <div className="filter-grid w-full block">
              <div className="search-wrapper relative w-full block">
                <Search
                  size={18}
                  className="search-icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  className="search-input w-full block"
                  type="text"
                  placeholder="Search by Class or Session..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="attendance-table">
              <thead className="table-head">
                <tr>
                  <th scope="col" className="table-heading">Class</th>
                  <th scope="col" className="table-heading">Session Date</th>
                  <th scope="col" className="table-heading">Session Duration</th>
                  <th scope="col" className="table-heading">Time Attended</th>
                  <th scope="col" className="table-heading">Attendance %</th>
                  <th scope="col" className="table-heading">Status</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="no-data">
                      No attendance found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr key={row.key} className="table-row">
                      <td className="table-cell">
                        <p className="student-name">{row.classroomName}</p>
                        <p>{row.sessionTitle}</p>
                      </td>
                      <td className="table-cell">
                        {row.sessionDate
                          ? new Date(row.sessionDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="table-cell">
                        {row.sessionDurationSeconds !== null
                          ? formatDuration(row.sessionDurationSeconds)
                          : "—"}
                      </td>
                      <td className="table-cell">
                        {formatDuration(row.timeAttendedSeconds)}
                      </td>
                      <td className="table-cell attendance-value">
                        {row.attendancePercentage.toFixed(1)}%
                      </td>
                      <td className="table-cell">
                        {row.isPresent ? (
                          <span className="status-present">Present</span>
                        ) : (
                          <span className="status-absent">Absent</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                data-tooltip="Go to previous page"
                title="Previous"
                className={`pagination-btn ${
                  currentPage === 1
                    ? "pagination-btn-disabled"
                    : "pagination-btn-active"
                }`}
              >
                Previous
              </button>

              <div className="pagination-pages">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    data-tooltip={`Go to page ${index + 1}`}
                    title={`Page ${index + 1}`}
                    className={`page-btn ${
                      currentPage === index + 1
                        ? "page-btn-active"
                        : "page-btn-inactive"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                data-tooltip="Go to next page"
                title="Next"
                className={`pagination-btn ${
                  currentPage === totalPages
                    ? "pagination-btn-disabled"
                    : "pagination-btn-active"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <div className="attendance-container">


        <div className="attendance-header">
          <div>
            <h1 className="attendance-title">
              <CalendarCheck className="text-indigo-600" size={26} />
              Attendance Dashboard
            </h1>

            <p className="attendance-subtitle">
              Manage student attendance records.
            </p>
          </div>

          <div className="header-buttons">
            <button
              onClick={exportExcel}
              className="export-btn"
              disabled={filteredData.length === 0}
              data-tooltip="Export attendance records to Excel spreadsheet"
              title={
                filteredData.length === 0
                  ? "No attendance to export yet"
                  : "Export the attendance shown below"
              }
            >
              <Download size={18} />
              Export Excel
            </button>
          </div>
        </div>



        <div className="attendance-stats-grid">
          <StatCard
            icon={<Users />}
            label="Total Students"
            value={totalStudents}
            colorClass="bg-blue-soft"
          />
          <StatCard
            icon={<UserCheck />}
            label="Present Sessions"
            value={presentSessions}
            colorClass="bg-green-soft"
          />
          <StatCard
            icon={<UserX />}
            label="Absent Sessions"
            value={absentSessions}
            colorClass="bg-orange-soft"
          />
          <StatCard
            icon={<CalendarDays />}
            label="Attendance"
            value={`${attendancePercentage}%`}
            colorClass="bg-purple-soft"
          />
        </div>



        <div className="filter-card w-full block">
          <div className="filter-grid w-full block">
            <div className="search-wrapper relative w-full block">
              <Search
                size={18}
                className="search-icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />

              <input
                className="search-input w-full block"
                type="text"
                placeholder="Search by Name or Email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>


        <div className="table-wrapper">
          <table className="attendance-table">
            <thead className="table-head">
              <tr>
                <th scope="col" className="table-heading">Student</th>
                <th scope="col" className="table-heading">Email</th>
                <th scope="col" className="table-heading">Classroom</th>
                <th scope="col" className="table-heading">Total Sessions</th>
                <th scope="col" className="table-heading">Present</th>
                <th scope="col" className="table-heading">Absent</th>
                <th scope="col" className="table-heading">Attendance %</th>
                <th scope="col" className="table-heading text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-data">
                    No attendance found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((student) => (
                  <tr key={student.key} className="table-row">
                    <td className="table-cell">
                      <div>
                        <p className="student-name">{student.name}</p>
                      </div>
                    </td>
                    <td className="table-cell">{student.email}</td>
                    <td className="table-cell">{student.classroom}</td>
                    <td className="table-cell">{student.totalSessions}</td>
                    <td className="table-cell">{student.presentSessions}</td>
                    <td className="table-cell">{student.absentSessions}</td>

                    <td className="table-cell attendance-value">
                      {student.attendancePercentage}%
                    </td>

                    <td className="table-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleDelete(student.key)}
                          className="delete-btn"
                          data-tooltip={`Delete ${student.name}'s attendance record`}
                          title="Delete record"
                          aria-label={`Delete ${student.name}'s attendance record`}
                        >
                          <Trash2 size={18} className="delete-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>


        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              data-tooltip="Go to previous page"
              title="Previous"
              className={`pagination-btn ${
                currentPage === 1
                  ? "pagination-btn-disabled"
                  : "pagination-btn-active"
              }`}
            >
              Previous
            </button>

            <div className="pagination-pages">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  data-tooltip={`Go to page ${index + 1}`}
                  title={`Page ${index + 1}`}
                  className={`page-btn ${
                    currentPage === index + 1
                      ? "page-btn-active"
                      : "page-btn-inactive"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              data-tooltip="Go to next page"
              title="Next"
              className={`pagination-btn ${
                currentPage === totalPages
                  ? "pagination-btn-disabled"
                  : "pagination-btn-active"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceHome;
