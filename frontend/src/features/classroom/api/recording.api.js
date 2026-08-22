import api from "../../../config/axios.config";

// The backend serves uploaded files as static assets rooted at "/uploads"
// (see backend/src/app.js), and a Recording's fileUrl is the multer-saved
// path (e.g. "uploads/1699999999.mp4") — so the playable URL is just the
// API origin (baseURL minus the trailing "/api") plus that path.
const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/api\/?$/, "");

export const getRecordingUrl = (fileUrl) => `${API_ORIGIN}/${fileUrl}`;

// ======================================
// Upload a recording (teacher only)
// ======================================
export const uploadRecording = async (formData) => {
  const response = await api.post("/recordings", formData, {
    // Let the browser set "multipart/form-data" with the correct boundary
    // itself — the api instance's default "application/json" header would
    // otherwise override it and the server couldn't parse the body.
    headers: { "Content-Type": undefined },
  });

  return response.data;
};

// ======================================
// Get all recordings for a classroom
// ======================================
export const getClassroomRecordings = async (classroomId) => {
  const response = await api.get(`/recordings/classroom/${classroomId}`);

  return response.data;
};

// ======================================
// Delete a recording (teacher only)
// ======================================
export const deleteRecording = async (id) => {
  const response = await api.delete(`/recordings/${id}`);

  return response.data;
};
