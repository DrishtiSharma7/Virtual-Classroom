import { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import usePageMeta from "../../../../hooks/usePageMeta";

const TeacherRecordingsHome = lazy(() => import("./TeacherRecordingsHome"));
const StudentRecordingsHome = lazy(() => import("./StudentRecordingsHome"));

function RecordingsLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5b5fef] border-t-transparent" />
    </div>
  );
}

export default function RecordingsHome() {
  const { role, user } = useSelector((state) => state.auth);
  usePageMeta("Recordings");

  const currentRole =
    role ||
    localStorage.getItem("role") ||
    user?.role ||
    JSON.parse(localStorage.getItem("user") || "null")?.role;

  if (!currentRole) {
    return <RecordingsLoading />;
  }

  return (
    <Suspense fallback={<RecordingsLoading />}>
      {currentRole === "teacher" ? (
        <TeacherRecordingsHome />
      ) : (
        <StudentRecordingsHome />
      )}
    </Suspense>
  );
}
