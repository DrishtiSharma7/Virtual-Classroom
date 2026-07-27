import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyClassrooms, deleteClassroom } from "../../api/classroom.api";
import { LayoutDashboard, Trash, Users, ArrowRight, Plus } from "lucide-react";
import "./ClassroomHome.css";

function ClassroomHome() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const data = await getMyClassrooms();

      console.log("Classrooms:", data);

      setClassrooms(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="classroom-loading">Loading...</div>;
  }

  if (error) {
    return <div className="classroom-error">{error}</div>;
  }

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

  return (
    <div className="classroom-page">
      <div className="classroom-container">
        {/* Header */}
        <div className="classroom-header">
          <div>
            <h1 className="classroom-title">My Classrooms</h1>

            <p className="classroom-subtitle">
              Manage all your classrooms from one place.
            </p>
          </div>

          <Link to="/classrooms/create" className="create-classroom-btn">
            <Plus size={20} />
            Create Classroom
          </Link>
        </div>

        {/* Cards */}
        <div className="classroom-grid">
          {classrooms.map((room) => (
            <div key={room.id} className="classroom-card">
              <div className="classroom-card-header">
                <h2 className="classroom-name">{room.name}</h2>

                <span className="classroom-status">Active</span>

                <button
                  onClick={() => handleDelete(room._id)}
                  className="delete-btn"
                  title="Delete Classroom"
                >
                  <Trash size={18} className="delete-icon" />
                </button>
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
                    Students
                  </span>

                  <span className="classroom-detail-value">
                    {room.students.length}
                  </span>
                </div>
              </div>

              <Link
                to={`/classrooms/${room._id}`}
                className="enter-classroom-btn"
              >
                Enter Classroom
                <ArrowRight size={18} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClassroomHome;
