import api from "../../../config/axios.config";

export const createAnnouncement = async (payload) => {
  const response = await api.post("/announcements", payload);
  return response.data;
};

export const getClassroomAnnouncements = async (classroomId) => {
  const response = await api.get(`/announcements/classroom/${classroomId}`);
  return response.data;
};
