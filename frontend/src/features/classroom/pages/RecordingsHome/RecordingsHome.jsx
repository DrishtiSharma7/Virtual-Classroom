import { useSelector } from "react-redux";

import TeacherRecordingsHome from "./TeacherRecordingsHome";
import StudentRecordingsHome from "./StudentRecordingsHome";
import usePageMeta from "../../../../hooks/usePageMeta";

export default function RecordingsHome() {
  const { role } = useSelector((state) => state.auth);
  usePageMeta("Recordings");

  if (!role) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <h2 className="text-sm text-gray-400">Loading...</h2>
      </div>
    );
  }

  return role === "teacher" ? (
    <TeacherRecordingsHome />
  ) : (
    <StudentRecordingsHome />
  );
}
