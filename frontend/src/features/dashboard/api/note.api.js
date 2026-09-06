import api from "../../../config/axios.config";

/**
 * Fetch all notes for the authenticated user
 * Returned notes are already sorted by isImportant: -1, createdAt: -1
 */
export const getNotes = async () => {
  const response = await api.get("/notes");
  return response.data?.notes || response.data || [];
};

/**
 * Create a new personal note
 */
export const createNote = async ({ text, isImportant = false }) => {
  const response = await api.post("/notes", { text, isImportant });
  return response.data?.note || response.data;
};

/**
 * Update an existing note
 */
export const updateNote = async (id, data) => {
  const response = await api.patch(`/notes/${id}`, data);
  return response.data?.note || response.data;
};

/**
 * Delete a note
 */
export const deleteNote = async (id) => {
  const response = await api.delete(`/notes/${id}`);
  return response.data;
};
