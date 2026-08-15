import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { KeyRound, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { joinClassroom } from "../../api/classroom.api";

function JoinClassroom() {
  const navigate = useNavigate();

  // Only students are allowed to join a classroom (mirrors backend role check).
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const role = storedUser?.role || localStorage.getItem("role") || "student";
  const isTeacher = role === "teacher";

  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [alreadyJoinedClassroom, setAlreadyJoinedClassroom] = useState(null);
  const [joinedClassroom, setJoinedClassroom] = useState(null);

  const handleChange = (e) => {
    setCode(e.target.value.toUpperCase());
    setErrors({});
  };

  const validate = () => {
    const nextErrors = {};
    if (!code.trim()) {
      nextErrors.code = "Join code is required.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setAlreadyJoinedClassroom(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const data = await joinClassroom(code.trim());
      setJoinedClassroom(data.classroom);
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 404) {
        setSubmitError("Invalid code. Please check and try again.");
      } else if (status === 400 && message === "Already joined") {
        setAlreadyJoinedClassroom(err.response?.data?.classroom || null);
      } else {
        setSubmitError(
          message ||
            "Something went wrong while joining the classroom. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (isTeacher) {
    return (
      <div className="flex items-center justify-center h-full bg-[#f4f3f3]">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Students only
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            Only student accounts can join a classroom.
          </p>
          <button
            onClick={() => navigate("/classrooms")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#5b5bd6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
          >
            Back to Classrooms
          </button>
        </div>
      </div>
    );
  }

  // Success state — the student has been enrolled.
  if (joinedClassroom) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>

          <h2 className="mb-1 text-xl font-bold text-gray-900">You're in!</h2>
          <p className="mb-6 text-sm text-gray-500">
            You've successfully joined the classroom.
          </p>

          <div className="mb-6 rounded-xl bg-slate-50 px-4 py-3 text-left text-sm text-gray-600">
            <p>
              <span className="font-semibold text-gray-800">Name:</span>{" "}
              {joinedClassroom.name}
            </p>
            <p>
              <span className="font-semibold text-gray-800">Subject:</span>{" "}
              {joinedClassroom.subject}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(`/classrooms/${joinedClassroom._id}`)}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#5b5bd6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
            >
              Go to Classroom
            </button>
            <button
              type="button"
              onClick={() => navigate("/classrooms")}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Back to Classrooms
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Already-joined state — distinct from a generic error, offer a direct link if we have one.
  if (alreadyJoinedClassroom) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Already enrolled
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            You're already enrolled in this classroom.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                navigate(
                  alreadyJoinedClassroom._id
                    ? `/classrooms/${alreadyJoinedClassroom._id}`
                    : "/classrooms"
                )
              }
              className="flex-1 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#5b5bd6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
            >
              {alreadyJoinedClassroom._id
                ? "Go to Classroom"
                : "Back to Classrooms"}
            </button>
            {alreadyJoinedClassroom._id && (
              <button
                type="button"
                onClick={() => navigate("/classrooms")}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Back to Classrooms
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-transparent h-full px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/classrooms"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-[#4f46e5]"
        >
          <ArrowLeft size={16} />
          Back to Classrooms
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4f46e5]/10">
              <KeyRound className="h-6 w-6 text-[#4f46e5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Join Classroom
              </h1>
              <p className="text-sm text-gray-500">
                Enter the code your teacher shared with you.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <div>
              <label
                htmlFor="code"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Join Code
              </label>
              <input
                id="code"
                type="text"
                name="code"
                placeholder="e.g. AB12CD"
                value={code}
                onChange={handleChange}
                className={`h-11 w-full rounded-xl border bg-white px-4 text-sm uppercase tracking-[0.2em] text-gray-900 outline-none transition placeholder:text-gray-400 placeholder:tracking-normal focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)] focus:border-[#4f46e5] ${
                  errors.code ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-600">{errors.code}</p>
              )}
            </div>

            {submitError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#5b5bd6] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(79,70,229,0.35)] transition disabled:cursor-not-allowed disabled:opacity-70 hover:enabled:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Classroom"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default JoinClassroom;
