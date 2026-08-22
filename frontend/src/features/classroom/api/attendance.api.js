import api from "../../../config/axios.config";

export const getClassroomAttendance = async (classroomId) => {
  const response = await api.get(`/attendance/classroom/${classroomId}`);

  return response.data;
};

export const getSessionAttendance = async (sessionId) => {
  const response = await api.get(`/attendance/session/${sessionId}`);

  return response.data;
};

export const getAttendanceDashboard = async () => {
  const response = await api.get(`/attendance/dashboard`);

  return response.data;
};

export const getMyAttendance = async () => {
  const response = await api.get(`/attendance/me`);

  return response.data;
};

export const getLiveSessionAttendance = async (sessionId) => {
  const response = await api.get(`/attendance/session/${sessionId}/live`);

  return response.data;
};
