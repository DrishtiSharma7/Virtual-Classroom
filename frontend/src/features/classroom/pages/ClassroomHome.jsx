import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowRight,
  Plus,
} from "lucide-react";

function ClassroomHome() {
  const classrooms = [
    {
      id: 1,
      name: "MERN Stack Batch",
      subject: "Web Development",
      code: "MERN101",
      students: 35,
    },
    {
      id: 2,
      name: "Python Batch",
      subject: "Programming",
      code: "PY202",
      students: 42,
    },
    {
      id: 3,
      name: "Java Batch",
      subject: "Programming",
      code: "JAVA303",
      students: 28,
    },
    {
      id: 4,
      name: "DBMS",
      subject: "Computer Science",
      code: "DB404",
      students: 31,
    },
  ];

  return (
    <div className="min-h-screen #f4f3f3 pl-10 pr-4">

      <div className="max-w-7xl mx-auto">

        {/* Header */}

        <div className="flex justify-between items-center mb-6 ">

          <div>

            <h1 className="text-2xl font-bold text-slate-800">
              My Classrooms
            </h1>

            <p className="text-slate-500 mt-2">
              Manage all your classrooms from one place.
            </p>

          </div>

          <Link
            to="/classrooms/create"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl transition"
          >
            <Plus size={20} />
            Create Classroom
          </Link>

        </div>

        {/* Cards */}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

          {classrooms.map((room) => (

            <div
              key={room.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-6"
            >

              <div className="flex justify-between items-center">

                  <h2 className="text-xl font-bold mt-1">
                {room.name}
              </h2>
                <span className="mt-4 bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
                  Active
                </span>

              </div>

              <p className="text-gray-500">
                {room.subject}
              </p>

              <div className="mt-6 space-y-3">

                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-500">
                    <LayoutDashboard size={18} />
                    Room Code
                  </span>

                  <span className="font-semibold">
                    {room.code}
                  </span>
                </div>

                <div className="flex justify-between">

                  <span className="flex items-center gap-2 text-gray-500">
                    <Users size={18} />
                    Students
                  </span>

                  <span className="font-semibold">
                    {room.students}
                  </span>

                </div>

              </div>

              <Link
                to={`/classrooms/${room.id}`}
                className="mt-6 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl transition"
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