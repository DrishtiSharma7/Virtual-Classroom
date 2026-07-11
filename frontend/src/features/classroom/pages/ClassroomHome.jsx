import { Link } from "react-router-dom";

function ClassroomHome() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Virtual Classrooms
          </h1>

          <Link
            to="/classrooms/create"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            + Create Classroom
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold">
              MERN Stack Batch
            </h2>

            <p className="mt-2 text-gray-600">
              Room Code : ABC123
            </p>

            <button className="mt-5 w-full bg-green-600 text-white py-2 rounded-lg">
              Enter Classroom
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold">
              Python Batch
            </h2>

            <p className="mt-2 text-gray-600">
              Room Code : XYZ456
            </p>

            <button className="mt-5 w-full bg-green-600 text-white py-2 rounded-lg">
              Enter Classroom
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ClassroomHome;