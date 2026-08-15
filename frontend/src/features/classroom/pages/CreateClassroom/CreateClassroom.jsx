import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
} from "lucide-react";
import { createClassroom } from "../../api/classroom.api";

function CreateClassroom() {
  const navigate = useNavigate();

  // Only teachers are allowed to create a classroom (mirrors backend role check).
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const role = storedUser?.role || localStorage.getItem("role") || "student";
  const isTeacher = role === "teacher";

  const [formData, setFormData] = useState({ name: "", subject: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdClassroom, setCreatedClassroom] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.name.trim()) {
      nextErrors.name = "Classroom name is required.";
    }
    if (!formData.subject.trim()) {
      nextErrors.subject = "Subject is required.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setLoading(true);
    try {
      const data = await createClassroom({
        name: formData.name.trim(),
        subject: formData.subject.trim(),
      });
      setCreatedClassroom(data.classroom);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
          "Something went wrong while creating the classroom. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!createdClassroom?.code) return;
    try {
      await navigator.clipboard.writeText(createdClassroom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context) — fail silently.
    }
  };

  if (!isTeacher) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Teachers only
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            Only teacher accounts can create a classroom.
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

  // Success state — show the auto-generated join code so the teacher can share it.
  if (createdClassroom) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>

          <h2 className="mb-1 text-xl font-bold text-gray-900">
            Classroom created!
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            Share this join code with your students so they can enroll.
          </p>

          <div className="mb-2 rounded-xl border border-dashed border-gray-300 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Join Code
            </p>
            <div className="mt-1 flex items-center justify-center gap-3">
              <span className="text-2xl font-bold tracking-[0.2em] text-[#4f46e5]">
                {createdClassroom.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label="Copy join code"
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-100"
              >
                {copied ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>

          <div className="mb-6 rounded-xl bg-slate-50 px-4 py-3 text-left text-sm text-gray-600">
            <p>
              <span className="font-semibold text-gray-800">Name:</span>{" "}
              {createdClassroom.name}
            </p>
            <p>
              <span className="font-semibold text-gray-800">Subject:</span>{" "}
              {createdClassroom.subject}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(`/classrooms/${createdClassroom._id}`)}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#5b5bd6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
            >
              Go to Classroom
            </button>
            <button
              type="button"
              onClick={() => navigate("/classrooms")}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              View All Classrooms
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-[#f4f3f3] px-4 py-10">
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
              <GraduationCap className="h-6 w-6 text-[#4f46e5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Create Classroom
              </h1>
              <p className="text-sm text-gray-500">
                Set up a new class for your students.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Classroom Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="e.g. Grade 10 - Physics"
                value={formData.name}
                onChange={handleChange}
                className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)] focus:border-[#4f46e5] ${
                  errors.name ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="subject"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Subject
              </label>
              <div className="relative">
                <BookOpen
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="subject"
                  type="text"
                  name="subject"
                  placeholder="e.g. Physics"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)] focus:border-[#4f46e5] ${
                    errors.subject ? "border-red-400" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.subject && (
                <p className="mt-1 text-xs text-red-600">{errors.subject}</p>
              )}
            </div>

            <p className="text-xs text-gray-400">
              A unique join code will be generated automatically once the
              classroom is created — you'll share this with your students.
            </p>

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
                  Creating...
                </>
              ) : (
                "Create Classroom"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateClassroom;