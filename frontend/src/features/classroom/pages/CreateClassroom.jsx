import { useState } from "react";

function CreateClassroom() {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(name);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow w-450px"
      >
        <h2 className="text-3xl font-bold mb-6">
          Create Classroom
        </h2>

        <input
          type="text"
          placeholder="Classroom Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border w-full p-3 rounded-lg mb-5"
        />

        <button
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          Create
        </button>
      </form>
    </div>
  );
}

export default CreateClassroom;