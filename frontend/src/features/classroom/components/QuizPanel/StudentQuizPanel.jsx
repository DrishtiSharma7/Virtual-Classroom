import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

import { submitQuiz } from "../../api/quiz.api";

/**
 * Student-facing Live Quiz panel.
 *
 * props:
 *  - socket: the live socket.io-client instance (socketRef.current)
 *  - sessionId: current live session id (room id)
 *  - studentId: current user's id (for the optional live tally broadcast)
 *  - onClose: called when the student dismisses the panel after it's done
 */
export default function StudentQuizPanel({ socket, sessionId, studentId, onClose }) {
  const [quiz, setQuiz] = useState(null); // { quizId, questions: [{ _id, question, options, timeLimit }] }
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]); // running list of chosen option indices
  const [locked, setLocked] = useState(false);
  const [revealedAnswer, setRevealedAnswer] = useState(null); // correctAnswer for current index, once known
  const [timeLeft, setTimeLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const timerRef = useRef(null);
  const answersRef = useRef([]);

  /* ---------------- Socket listeners ---------------- */

  useEffect(() => {
    if (!socket) return;

    const onLaunched = (payload) => {
      setQuiz(payload);
      setQuestionIndex(0);
      setSelected(null);
      setAnswers([]);
      answersRef.current = [];
      setLocked(false);
      setRevealedAnswer(null);
      setFinished(false);
      setScore(null);
    };

    const onRevealed = ({ questionIndex: revealedIndex, correctAnswer }) => {
      setQuestionIndex((currentIndex) => {
        if (revealedIndex !== currentIndex) return currentIndex;

        clearInterval(timerRef.current);
        setRevealedAnswer(correctAnswer);

        // Move to the next question shortly after seeing the correct answer.
        setTimeout(() => {
          setQuestionIndex((i) => i + 1);
          setSelected(null);
          setLocked(false);
          setRevealedAnswer(null);
        }, 1800);

        return currentIndex;
      });
    };

    const onClosed = async () => {
      clearInterval(timerRef.current);

      if (!quiz) return;

      try {
        const { score: finalScore } = await submitQuiz(quiz.quizId, answersRef.current);
        setScore(finalScore);
      } catch (err) {
        setSubmitError(
          err?.response?.data?.message || "Could not submit your answers."
        );
      } finally {
        setFinished(true);
      }
    };

    socket.on("quiz-launched", onLaunched);
    socket.on("answer-revealed", onRevealed);
    socket.on("quiz-closed", onClosed);

    return () => {
      socket.off("quiz-launched", onLaunched);
      socket.off("answer-revealed", onRevealed);
      socket.off("quiz-closed", onClosed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, quiz]);

  /* ---------------- Per-question countdown ---------------- */

  useEffect(() => {
    if (!quiz || finished) return;
    const current = quiz.questions[questionIndex];
    if (!current) return; // ran past the last question, waiting for quiz-closed

    setTimeLeft(current.timeLimit || 60);

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          lockAnswer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, questionIndex, finished]);

  /* ---------------- Answer handling ---------------- */

  const lockAnswer = () => {
    setLocked((alreadyLocked) => {
      if (alreadyLocked) return true;

      setSelected((sel) => {
        const value = sel === null ? -1 : sel; // -1 = unanswered in time
        setAnswers((prev) => {
          const next = [...prev];
          next[questionIndex] = value;
          answersRef.current = next;
          return next;
        });

        socket?.emit("student-answered", { sessionId, studentId });

        return sel;
      });

      return true;
    });
  };

  const handleSelect = (optIndex) => {
    if (locked) return;
    setSelected(optIndex);
  };

  /* ---------------- Render ---------------- */

  if (!quiz) return null;

  const current = quiz.questions[questionIndex];

  return (
    <div className="w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Live Quiz Panel</h3>
        {finished && (
          <button onClick={onClose} aria-label="Close quiz panel">
            <X size={16} />
          </button>
        )}
      </div>

      {finished ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CheckCircle2 className="text-emerald-500" size={28} />
          <p className="text-sm font-medium text-slate-700">Quiz complete!</p>
          {score !== null ? (
            <p className="text-xs text-slate-500">
              You scored {score} / {quiz.questions.length}
            </p>
          ) : (
            submitError && (
              <p className="text-xs text-red-500">{submitError}</p>
            )
          )}
        </div>
      ) : current ? (
        <>
          <p className="mb-1 text-xs font-semibold text-slate-400">
            Question {questionIndex + 1} of {quiz.questions.length}
          </p>
          <p className="mb-3 text-sm text-slate-700">{current.question}</p>

          <div className="mb-3 grid grid-cols-2 gap-2">
            {current.options.map((opt, oi) => {
              const isCorrect = revealedAnswer !== null && oi === revealedAnswer;
              const isWrongPick =
                revealedAnswer !== null && oi === selected && oi !== revealedAnswer;

              return (
                <label
                  key={oi}
                  onClick={() => handleSelect(oi)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    isCorrect
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : isWrongPick
                        ? "border-red-300 bg-red-50 text-red-600"
                        : selected === oi
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-600"
                  } ${locked ? "cursor-not-allowed opacity-90" : ""}`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      selected === oi
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-slate-300"
                    }`}
                  >
                    {selected === oi && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  {opt}
                </label>
              );
            })}
          </div>

          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(timeLeft / (current.timeLimit || 60)) * 100}%` }}
            />
          </div>
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <span>{locked ? (revealedAnswer !== null ? "Answer revealed" : "Waiting for reveal...") : "Pick an option"}</span>
            <span>{String(timeLeft).padStart(2, "0")}s</span>
          </div>

          <button
            onClick={lockAnswer}
            disabled={selected === null || locked}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {locked ? "Submitted" : "Submit"}
          </button>
        </>
      ) : (
        <p className="py-4 text-center text-sm text-slate-400">
          Waiting for the teacher to end the quiz...
        </p>
      )}
    </div>
  );
}
