import api from "../../../config/axios.config";

export const createQuiz = async (payload) => {
  const response = await api.post("/quizzes", payload);

  return response.data;
};

export const submitQuiz = async (quizId, answers, source = "live") => {
  const response = await api.post(`/quizzes/submit/${quizId}`, {
    answers,
    source,
  });

  return response.data;
};

export const getQuizResults = async (quizId) => {
  const response = await api.get(`/quizzes/results/${quizId}`);

  return response.data;
};

export const deleteQuiz = async (quizId) => {
  const response = await api.delete(`/quizzes/${quizId}`);

  return response.data;
};

export const getClassroomQuizzes = async (classroomId) => {
  const response = await api.get(`/quizzes/classroom/${classroomId}`);

  return response.data;
};

export const getQuizDetail = async (quizId) => {
  const response = await api.get(`/quizzes/${quizId}/detail`);

  return response.data;
};

export const toggleQuizRetake = async (quizId, open) => {
  const response = await api.patch(`/quizzes/${quizId}/retake`, { open });

  return response.data;
};
