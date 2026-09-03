import api from "../../../config/axios.config";

export const createAnnouncement = async (payload) => {
  const response = await api.post("/announcements", payload);
  return response.data;
};

export const getClassroomAnnouncements = async (classroomId) => {
  const response = await api.get(`/announcements/classroom/${classroomId}`);
  return response.data;
};

export const updateAnnouncement = async (id, payload) => {
  const response = await api.put(`/announcements/${id}`, payload);
  return response.data;
};

export const deleteAnnouncement = async (id) => {
  const response = await api.delete(`/announcements/${id}`);
  return response.data;
};
