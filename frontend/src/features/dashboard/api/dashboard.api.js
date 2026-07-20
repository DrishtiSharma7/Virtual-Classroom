import api from "../../../config/axios.config";

export const getDashboard = async () => {
  const response = await api.get("/dashboard");
  return response.data;
};
