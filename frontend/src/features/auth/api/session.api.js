import api from "../../../config/axios.config";

export const createSession = (data) => {
  return api.post("/sessions", data);
};

export const startSession = (id) => {
  return api.patch(`/sessions/${id}/start`);
};

export const endSession = (id) => {
  return api.patch(`/sessions/${id}/end`);
};

export const getSession = (id) => {
  return api.get(`/sessions/${id}`);
};

export const getSessionsByClassroom = (classroomId) => {
  return api.get(`/sessions/classroom/${classroomId}`);
};
