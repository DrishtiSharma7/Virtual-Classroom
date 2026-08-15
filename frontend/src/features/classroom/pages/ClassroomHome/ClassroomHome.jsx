import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyClassrooms, deleteClassroom } from "../../api/classroom.api";
import {
  LayoutDashboard,
  Trash,
  Users,
  ArrowRight,
  Plus,
  KeyRound,
} from "lucide-react";
import "./ClassroomHome.css";

function ClassroomHome() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Role check — adjust this to match how your app actually stores the logged-in user.
  // Assuming: localStorage me "user" object save hota hai jisme role field hai.
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const role = storedUser?.role || "student"; // "teacher" | "student"
  const isTeacher = role === "teacher";

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const data = await getMyClassrooms();
      setClassrooms(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this classroom?"
    );
    if (!confirmDelete) return;

    try {
      await deleteClassroom(id);
      setClassrooms((prev) => prev.filter((room) => room._id !== id));
      alert("Classroom deleted successfully");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="classroom-loading">Loading...</div>;
  }

  if (error) {
    return <div className="classroom-error">{error}</div>;
  }

  return (
    <div className="classroom-page">
      <div className="classroom-container">
        {/* Header */}
        <div className="classroom-header">
          <div>
            <h1 className="classroom-title">
              {isTeacher ? "My Classrooms" : "My Classrooms"}
            </h1>
            <p className="classroom-subtitle">
              {isTeacher
                ? "Manage all your classrooms from one place."
                : "All the classrooms you've joined."}
            </p>
          </div>

          {/* Create button sirf teacher ko dikhega */}
          {isTeacher && (
            <Link to="/classrooms/create" className="create-classroom-btn">
              <Plus size={20} />
              Create Classroom
            </Link>
          )}

          {/* Join button sirf student ko dikhega */}
          {!isTeacher && (
            <Link to="/classrooms/join" className="create-classroom-btn">
              <KeyRound size={20} />
              Join Classroom
            </Link>
          )}
        </div>

        {/* Empty state */}
        {classrooms.length === 0 && (
          <div className="classroom-empty">
            {isTeacher
              ? "You haven't created any classrooms yet."
              : "You haven't joined any classrooms yet."}
          </div>
        )}

        {/* Cards */}
        <div className="classroom-grid">
          {classrooms.map((room) => (
            <div key={room._id} className="classroom-card">
              <div className="classroom-card-header">
                <h2 className="classroom-name">{room.name}</h2>
                <span className="classroom-status">Active</span>
              </div>

              <p className="classroom-subject">{room.subject}</p>

              <div className="classroom-details">
                <div className="classroom-detail-row">
                  <span className="classroom-detail-label">
                    <LayoutDashboard size={18} />
                    Room Code
                  </span>
                  <span className="classroom-detail-value">{room.code}</span>
                </div>

                {/* Teacher ko student count, student ko total classmates count */}
                <div className="classroom-detail-row">
                  <span className="classroom-detail-label">
                    <Users size={18} />
                    {isTeacher ? "Students" : "Classmates"}
                  </span>
                  <span className="classroom-detail-value">
                    {isTeacher
                      ? room.students?.length ?? 0
                      : Math.max((room.students?.length ?? 1) - 1, 0)}
                  </span>
                </div>
              </div>

              <div className="classroom-enter-delete">
              <Link
                to={`/classrooms/${room._id}`}
                className="enter-classroom-btn"
              >
                Enter Classroom
                <ArrowRight size={18} />
              </Link>
              {/* Delete button sirf teacher ko dikhega */}
                {isTeacher && (
                  <button
                    onClick={() => handleDelete(room._id)}
                    className="delete-btn"
                    title="Delete Classroom"
                  >
                    <Trash size={24} className="delete-icon" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClassroomHome;