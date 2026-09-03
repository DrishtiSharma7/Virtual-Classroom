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
import usePageMeta from "../../../../hooks/usePageMeta";

function ClassroomHome() {
  usePageMeta("My Classrooms");
  const [classrooms, setClassrooms] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_classrooms");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(classrooms.length === 0);
  const [error, setError] = useState("");

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const role = storedUser?.role || "student";
  const isTeacher = role === "teacher";

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const data = await getMyClassrooms();
      if (Array.isArray(data)) {
        setClassrooms(data);
        localStorage.setItem("cached_classrooms", JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      if (classrooms.length === 0) {
        setError("Failed to load classrooms");
      }
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
      const updated = classrooms.filter((room) => room._id !== id);
      setClassrooms(updated);
      localStorage.setItem("cached_classrooms", JSON.stringify(updated));
      alert("Classroom deleted successfully");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading && classrooms.length === 0) {
    return (
      <div className="classroom-page">
        <div className="classroom-container">
          <div className="classroom-header">
            <div>
              <h1 className="classroom-title">My Classrooms</h1>
              <p className="classroom-subtitle">
                {isTeacher
                  ? "Manage all your classrooms from one place."
                  : "Access all your enrolled classes."}
              </p>
            </div>
          </div>
          <div className="classroom-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4"
              >
                <div className="h-6 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-100" />
                <div className="h-10 w-full rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && classrooms.length === 0) {
    return <div className="classroom-error">{error}</div>;
  }

  return (
    <div className="classroom-page">
      <div className="classroom-container">

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


          {isTeacher && (
            <Link
              to="/classrooms/create"
              className="create-classroom-btn"
              data-tooltip="Create a new classroom and invite students"
              title="Create Classroom"
            >
              <Plus size={20} />
              Create Classroom
            </Link>
          )}


          {!isTeacher && (
            <Link
              to="/classrooms/join"
              className="create-classroom-btn"
              data-tooltip="Enter an invite code to join a classroom"
              title="Join Classroom"
            >
              <KeyRound size={20} />
              Join Classroom
            </Link>
          )}
        </div>


        {classrooms.length === 0 && (
          <div className="classroom-empty">
            {isTeacher
              ? "You haven't created any classrooms yet."
              : "You haven't joined any classrooms yet."}
          </div>
        )}


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
                  data-tooltip="Open classroom details, stream, and classwork"
                  title="Enter Classroom"
                >
                  Enter Classroom
                  <ArrowRight size={18} />
                </Link>

                {isTeacher && (
                  <button
                    onClick={() => handleDelete(room._id)}
                    className="delete-btn"
                    data-tooltip="Permanently delete this classroom"
                    title="Delete Classroom"
                    aria-label={`Delete ${room.name}`}
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