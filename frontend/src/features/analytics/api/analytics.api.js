import api from "../../../config/axios.config";

function clean(params) {
  const out = {};
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value;
    }
  });
  return out;
}

export const getOverview = async (params) => {
  const response = await api.get("/analytics/overview", { params: clean(params) });
  return response.data;
};

export const getAttendanceAnalytics = async (params) => {
  const response = await api.get("/analytics/attendance", { params: clean(params) });
  return response.data;
};

export const getSessionAnalytics = async (params) => {
  const response = await api.get("/analytics/sessions", { params: clean(params) });
  return response.data;
};

export const getQuizAnalytics = async (params) => {
  const response = await api.get("/analytics/quizzes", { params: clean(params) });
  return response.data;
};

export const getClassComparison = async (params) => {
  const response = await api.get("/analytics/classes", { params: clean(params) });
  return response.data;
};

export const getStudentDetail = async (studentId, params) => {
  const response = await api.get(`/analytics/students/${studentId}`, {
    params: clean(params),
  });
  return response.data;
};

export const getMyAnalytics = async (params) => {
  const response = await api.get("/analytics/me", { params: clean(params) });
  return response.data;
};
