import api from "../../../config/axios.config";

export const getSettings = async () => {
  const response = await api.get("/settings");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/settings/profile", data);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.put("/settings/password", data);
  return response.data;
};

export const updateSessionSettings = async (data) => {
  const response = await api.put("/settings/session", data);
  return response.data;
};

export const updateTeacherSettings = async (data) => {
  const response = await api.put("/settings/teacher", data);
  return response.data;
};

export const updateStudentSettings = async (data) => {
  const response = await api.put("/settings/student", data);
  return response.data;
};

export default {
  getSettings,
  updateProfile,
  changePassword,
  updateSessionSettings,
  updateTeacherSettings,
  updateStudentSettings,
};