import { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import usePageMeta from "../../../../hooks/usePageMeta";

const TeacherQuizHome = lazy(() => import("./TeacherQuizHome"));
const StudentQuizHome = lazy(() => import("./StudentQuizHome"));

function QuizLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5b5fef] border-t-transparent" />
    </div>
  );
}

export default function QuizHome() {
  const { role, user } = useSelector((state) => state.auth);
  usePageMeta("Quizzes");

  const currentRole =
    role ||
    localStorage.getItem("role") ||
    user?.role ||
    JSON.parse(localStorage.getItem("user") || "null")?.role;

  if (!currentRole) {
    return <QuizLoading />;
  }

  return (
    <Suspense fallback={<QuizLoading />}>
      {currentRole === "teacher" ? <TeacherQuizHome /> : <StudentQuizHome />}
    </Suspense>
  );
}
