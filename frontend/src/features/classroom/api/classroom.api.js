import api from "../../../config/axios.config";

export const createClassroom = async (payload) => {
  const response = await api.post("/classrooms", payload);
  return response.data;
};

export const joinClassroom = async (code) => {
  const response = await api.post(`/classrooms/join/${code}`);
  return response.data;
};

export const getMyClassrooms = async () => {
  const response = await api.get("/classrooms/my");
  return response.data;
};

export const getClassroomById = async (id) => {
  const response = await api.get(`/classrooms/${id}`);
  return response.data;
};

export const deleteClassroom = async (id) => {
  const response = await api.delete(`/classrooms/${id}`);
  return response.data;
};