import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Search,
  Download,
  Upload,
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  Trash2,
  Eye,
  Pencil,
} from "lucide-react";
import "./AttendanceHome.css";
import { getClassroomAttendance } from "../../api/attendance.api";

function AttendanceHome() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { classroomId } = useParams();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 5;

  const filteredData = useMemo(() => {
    return attendance.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || student.status === statusFilter;

      const matchesDate = !dateFilter || student.date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [attendance, search, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalStudents = attendance.length;

  const presentStudents = attendance.filter(
    (s) => s.status === "Present"
  ).length;

  const absentStudents = attendance.filter((s) => s.status === "Absent").length;

  const attendancePercentage = (
    (presentStudents / totalStudents) *
    100
  ).toFixed(1);

  const handleDelete = (id) => {
    if (!window.confirm("Delete attendance record?")) return;

    setAttendance((prev) => prev.filter((student) => student.id !== id));
  };

  const exportExcel = () => {
    alert("Export Excel API will be called.");
  };

  const importExcel = () => {
    alert("Import Excel API will be called.");
  };

  const fetchAttendance = async () => {
    try {
      const data = await getClassroomAttendance(classroomId);
      setAttendance(data.attendance);
    } catch (err) {
      console.log(err);
      setError("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (classroomId) {
      fetchAttendance();
    }
  }, [classroomId]);

  return (
    <div className="attendance-page">
      <div className="attendance-container">
        {/* Header */}

        <div className="attendance-header">
          <div>
            <h1 className="attendance-title">Attendance Dashboard</h1>

            <p className="attendance-subtitle">
              Manage student attendance records.
            </p>
          </div>

          <div className="header-buttons">
            <button onClick={importExcel} className="import-btn">
              <Upload size={18} />
              Import Excel
            </button>

            <button onClick={exportExcel} className="export-btn">
              <Download size={18} />
              Export Excel
            </button>
          </div>
        </div>

        {/* Statistics Cards */}

        <div className="stats-grid">
          <div className="stat-card">
            <Users className="stat-icon-indigo" />
            <p className="stat-label">Total Students</p>
            <h2 className="stat-value">{totalStudents}</h2>
          </div>

          <div className="stat-card">
            <UserCheck className="stat-icon-green" />
            <p className="stat-label">Present</p>
            <h2 className="stat-value">{presentStudents}</h2>
          </div>

          <div className="stat-card">
            <UserX className="stat-icon-red" />
            <p className="stat-label">Absent</p>
            <h2 className="stat-value">{absentStudents}</h2>
          </div>

          <div className="stat-card">
            <CalendarDays className="stat-icon-blue" />
            <p className="stat-label">Attendance</p>
            <h2 className="stat-value">{attendancePercentage}%</h2>
          </div>
        </div>

        {/* Search & Filters */}

        <div className="filter-card">
          <div className="filter-grid">
            <div className="search-wrapper">
              <Search size={16} className="search-icon" />

              <input
                className="search-input"
                type="text"
                placeholder="Search by Name, Roll No or Email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="date-input"
            />

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="status-select"
            >
              <option>All</option>
              <option>Present</option>
              <option>Absent</option>
              <option>Leave</option>
            </select>
          </div>
        </div>
        {/* Attendance Table */}

        <div className="table-wrapper">
          <table className="attendance-table">
            <thead className="table-head">
              <tr>
                <th className="table-heading">Student</th>
                <th className="table-heading">Roll No</th>
                <th className="table-heading">Email</th>
                <th className="table-heading">Date</th>
                <th className="table-heading">Status</th>
                <th className="table-heading">Attendance %</th>
                <th className="table-heading text-center">Actions</th>
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
                  <tr key={student.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <p className="student-name">{student.name}</p>
                      </div>
                    </td>
                    <td className="table-cell">{student.rollNo}</td>
                    <td className="table-cell">{student.email}</td>
                    <td className="table-cell">{student.date}</td>
                    <td className="table-cell">
                      {student.status === "Present" && (
                        <span className="status-present">Present</span>
                      )}

                      {student.status === "Absent" && (
                        <span className="status-absent">Absent</span>
                      )}

                      {student.status === "Leave" && (
                        <span className="status-leave">Leave</span>
                      )}
                    </td>

                    <td className="table-cell attendance-value">
                      {student.percentage}%
                    </td>

                    <td className="table-cell">
                      <div className="action-buttons">
                        <button className="view-btn">
                          <Eye size={18} className="view-icon" />
                        </button>

                        <button className="edit-btn">
                          <Pencil size={18} className="edit-icon" />
                        </button>

                        <button
                          onClick={() => handleDelete(student.id)}
                          className="delete-btn"
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
        {/* Pagination */}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
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
