import api from "../../../config/axios.config";

/* Load chat history for a live session (so refresh / late-join isn't blank) */
export const getChatHistory = async (sessionId) => {
  const response = await api.get(`/chat/session/${sessionId}`);
  return response.data;
};