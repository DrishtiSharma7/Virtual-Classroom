import api from "../../../config/axios.config";

// ======================================
// Get Classroom Attendance Dashboard
// ======================================
export const getClassroomAttendance = async (classroomId) => {
  const response = await api.get(`/attendance/classroom/${classroomId}`);

  return response.data;
};

// ======================================
// Get Single Session Attendance
// ======================================
export const getSessionAttendance = async (sessionId) => {
  const response = await api.get(`/attendance/session/${sessionId}`);

  return response.data;
};
