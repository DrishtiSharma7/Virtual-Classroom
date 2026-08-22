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

// ======================================
// Get Attendance Dashboard (all classrooms)
// ======================================
export const getAttendanceDashboard = async () => {
  const response = await api.get(`/attendance/dashboard`);

  return response.data;
};

// ======================================
// Get My Own Attendance (student)
// ======================================
export const getMyAttendance = async () => {
  const response = await api.get(`/attendance/me`);

  return response.data;
};

// ======================================
// Get Live (in-progress) Session Attendance (teacher)
// ======================================
export const getLiveSessionAttendance = async (sessionId) => {
  const response = await api.get(`/attendance/session/${sessionId}/live`);

  return response.data;
};
