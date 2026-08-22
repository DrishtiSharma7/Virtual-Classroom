import api from "../../../config/axios.config";

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/api\/?$/, "");

export const getRecordingUrl = (fileUrl) => `${API_ORIGIN}/${fileUrl}`;

export const uploadRecording = async (formData) => {
  const response = await api.post("/recordings", formData, {
    headers: { "Content-Type": undefined },
  });

  return response.data;
};

export const getClassroomRecordings = async (classroomId) => {
  const response = await api.get(`/recordings/classroom/${classroomId}`);

  return response.data;
};

export const deleteRecording = async (id) => {
  const response = await api.delete(`/recordings/${id}`);

  return response.data;
};
