import api from "../../../config/axios.config";

export const getWhiteboard = async (sessionId) => {
  const response = await api.get(`/whiteboard/session/${sessionId}`);
  return response.data;
};

export default { getWhiteboard };