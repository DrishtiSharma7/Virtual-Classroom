import api from "../../../config/axios.config";

/* Create Session */

export const createSession = (data) => {
  return api.post("/sessions", data);
};

/* Start Session */

export const startSession = (id) => {
  return api.patch(`/sessions/${id}/start`);
};

/* End Session */

export const endSession = (id) => {
  return api.patch(`/sessions/${id}/end`);
};

/* Get Session */

export const getSession = (id) => {
  return api.get(`/sessions/${id}`);
};

/* Classroom Sessions */

export const getSessionsByClassroom = (classroomId) => {
  return api.get(`/sessions/classroom/${classroomId}`);
};
