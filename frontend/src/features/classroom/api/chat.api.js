import api from "../../../config/axios.config";

export const getChatHistory = async (sessionId) => {
  const response = await api.get(`/chat/session/${sessionId}`);
  return response.data;
};