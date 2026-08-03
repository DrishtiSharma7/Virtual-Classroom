import { useSelector } from "react-redux";

import TeacherQuizHome from "./TeacherQuizHome";
import StudentQuizHome from "./StudentQuizHome";

export default function QuizHome() {
  const { role } = useSelector((state) => state.auth);

  if (!role) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <h2 className="text-sm text-gray-400">Loading...</h2>
      </div>
    );
  }

  return role === "teacher" ? <TeacherQuizHome /> : <StudentQuizHome />;
}
