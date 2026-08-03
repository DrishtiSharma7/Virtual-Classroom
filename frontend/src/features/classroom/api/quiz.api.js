import api from "../../../config/axios.config";

// ======================================
// Create Quiz
// ======================================
export const createQuiz = async (payload) => {
  // payload: { session, questions: [{ question, options, correctAnswer, timeLimit }] }
  const response = await api.post("/quiz", payload);

  return response.data; // { message, quiz }
};

// ======================================
// Submit Quiz (student)
// ======================================
export const submitQuiz = async (quizId, answers) => {
  const response = await api.post(`/quiz/submit/${quizId}`, { answers });

  return response.data; // { message, score, response }
};

// ======================================
// Get Quiz Results (teacher)
// ======================================
export const getQuizResults = async (quizId) => {
  const response = await api.get(`/quiz/results/${quizId}`);

  return response.data; // array of QuizResponse populated with student {name, email}
};

// ======================================
// Delete Quiz (teacher)
// ======================================
export const deleteQuiz = async (quizId) => {
  const response = await api.delete(`/quiz/${quizId}`);

  return response.data;
};
