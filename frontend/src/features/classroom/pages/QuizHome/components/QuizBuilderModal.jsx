import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, X, Loader2, Upload, Download } from "lucide-react";
import { createQuiz } from "../../../api/quiz.api";
import { downloadQuizTemplate, parseQuizExcel } from "../../../utils/quizExcel";

const emptyQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  timeLimit: 60,
});

export default function QuizBuilderModal({
  isOpen,
  onClose,
  sessions = [],
  onQuizSaved,
}) {
  const [title, setTitle] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [builderError, setBuilderError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setSessionId(sessions[0]?._id || "");
      setQuestions([emptyQuestion()]);
      setBuilderError("");
    }
  }, [isOpen, sessions]);

  if (!isOpen) return null;

  const updateQuestion = (index, patch) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q))
    );
  };

  const updateOption = (qIndex, optIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((o, oi) => (oi === optIndex ? value : o)),
            }
          : q
      )
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (index) =>
    setQuestions((prev) => prev.filter((_, i) => i !== index));

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setBuilderError("");
      const imported = await parseQuizExcel(file);
      setQuestions((prev) => [
        ...prev.filter((q) => q.question.trim() !== ""),
        ...imported,
      ]);
      toast.success(`Imported ${imported.length} question(s) from Excel.`);
    } catch (err) {
      setBuilderError(err.message);
    } finally {
      e.target.value = "";
    }
  };

  const validQuestions = questions.filter(
    (q) =>
      q.question.trim() &&
      q.options.filter((o) => String(o).trim()).length >= 2 &&
      q.timeLimit >= 30 &&
      q.timeLimit <= 120
  );

  const handleSave = async () => {
    if (!sessionId) {
      setBuilderError("Select the class session this quiz belongs to.");
      return;
    }
    if (validQuestions.length === 0) {
      setBuilderError(
        "Add at least one question with 2+ options and a time limit between 30-120s."
      );
      return;
    }

    try {
      setSaving(true);
      setBuilderError("");

      await createQuiz({
        session: sessionId,
        title: title.trim() || "Untitled Quiz",
        questions: validQuestions.map((q) => ({
          question: q.question.trim(),
          options: q.options
            .map((o) => String(o).trim())
            .filter((o) => o !== ""),
          correctAnswer: Number(q.correctAnswer),
          timeLimit: Number(q.timeLimit) || 60,
        })),
      });

      toast.success("Quiz saved.");
      onClose();
      if (onQuizSaved) onQuizSaved();
    } catch (err) {
      setBuilderError(
        err?.response?.data?.message || "Could not save the quiz."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">New Quiz</h2>
          <button
            onClick={onClose}
            data-tooltip="Close"
            title="Close"
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {builderError && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {builderError}
          </p>
        )}

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Quiz title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 Recap"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#4f46e5]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Class session
            </label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#4f46e5]"
            >
              <option value="">Select a session</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title} — {new Date(s.startTime).toLocaleDateString()}
                </option>
              ))}
            </select>
            {sessions.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Create a class session for this classroom first.
              </p>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={handleImportClick}
            data-tooltip="Import Excel"
            title="Import from Excel"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-slate-50"
          >
            <Upload size={13} /> Import from Excel
          </button>
          <button
            onClick={downloadQuizTemplate}
            data-tooltip="Download Template"
            title="Download template"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-slate-50"
          >
            <Download size={13} /> Download template
          </button>
        </div>

        <div className="space-y-3">
          {questions.map((q, qi) => (
            <div
              key={qi}
              className="rounded-xl border border-gray-200 p-3 text-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">
                  Question {qi + 1}
                </span>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qi)}
                    data-tooltip="Delete Question"
                    title="Delete question"
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              <input
                value={q.question}
                onChange={(e) =>
                  updateQuestion(qi, { question: e.target.value })
                }
                placeholder="Question text"
                className="mb-2 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
              />

              <div className="mb-2 grid grid-cols-2 gap-1.5">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${
                      Number(q.correctAnswer) === oi
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={Number(q.correctAnswer) === oi}
                      onChange={() =>
                        updateQuestion(qi, { correctAnswer: oi })
                      }
                    />
                    <input
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="w-full bg-transparent outline-none"
                    />
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                Time limit (30-120s)
                <input
                  type="number"
                  min={30}
                  max={120}
                  value={q.timeLimit}
                  onChange={(e) =>
                    updateQuestion(qi, {
                      timeLimit: Number(e.target.value),
                    })
                  }
                  className="w-16 rounded-lg border border-gray-200 px-1.5 py-1"
                />
              </label>
            </div>
          ))}

          <button
            onClick={addQuestion}
            data-tooltip="Add Question"
            title="Add question"
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-1.5 text-xs font-medium text-gray-500 hover:bg-slate-50"
          >
            <Plus size={13} /> Add question
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={onClose}
            data-tooltip="Cancel"
            title="Cancel"
            className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            data-tooltip="Save Quiz"
            title="Save Quiz"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              "Save Quiz"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
