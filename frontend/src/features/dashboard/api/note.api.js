import api from "../../../config/axios.config";

export const getNotes = async () => {
  const response = await api.get("/notes");
  return response.data?.notes || response.data || [];
};

export const createNote = async ({ text, isImportant = false }) => {
  const response = await api.post("/notes", { text, isImportant });
  return response.data?.note || response.data;
};

export const updateNote = async (id, data) => {
  const response = await api.patch(`/notes/${id}`, data);
  return response.data?.note || response.data;
};

export const deleteNote = async (id) => {
  const response = await api.delete(`/notes/${id}`);
  return response.data;
};
