import { useSelector } from "react-redux";

import TeacherQuizHome from "./TeacherQuizHome";
import StudentQuizHome from "./StudentQuizHome";
import usePageMeta from "../../../../hooks/usePageMeta";

export default function QuizHome() {
  const { role, user } = useSelector((state) => state.auth);
  usePageMeta("Quizzes");

  const currentRole =
    role ||
    localStorage.getItem("role") ||
    user?.role ||
    JSON.parse(localStorage.getItem("user") || "null")?.role;

  if (!currentRole) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5b5fef] border-t-transparent" />
      </div>
    );
  }

  return currentRole === "teacher" ? <TeacherQuizHome /> : <StudentQuizHome />;
}
