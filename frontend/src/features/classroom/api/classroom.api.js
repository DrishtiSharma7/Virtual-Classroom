import api from "../../../config/axios.config";

export const getMyClassrooms = async () => {
  const response = await api.get("/classrooms/my");
  return response.data;
};

export const deleteClassroom = async (id) => {
  const response = await api.delete(`/classrooms/${id}`);
  return response.data;
};