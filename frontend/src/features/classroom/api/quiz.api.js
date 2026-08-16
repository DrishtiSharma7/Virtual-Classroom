import api from "../../../config/axios.config";

// ======================================
// Create Quiz
// ======================================
export const createQuiz = async (payload) => {
  // payload: { session, questions: [{ question, options, correctAnswer, timeLimit }] }
  const response = await api.post("/quizzes", payload);

  return response.data; // { message, quiz }
};

// ======================================
// Submit Quiz (student)
// source: "live" (default, used by the in-session live quiz panel) or
// "retake" (used when self-attempting from the Quiz page after the
// teacher has opened it for retake).
// ======================================
export const submitQuiz = async (quizId, answers, source = "live") => {
  const response = await api.post(`/quizzes/submit/${quizId}`, {
    answers,
    source,
  });

  return response.data; // { message, score, response }
};

// ======================================
// Get Quiz Results (teacher)
// ======================================
export const getQuizResults = async (quizId) => {
  const response = await api.get(`/quizzes/results/${quizId}`);

  return response.data; // { perStudent: [...], perQuestion: [...] } — was a bare array of QuizResponse
};

// ======================================
// Delete Quiz (teacher)
// ======================================
export const deleteQuiz = async (quizId) => {
  const response = await api.delete(`/quizzes/${quizId}`);

  return response.data;
};

// ======================================
// Get all quizzes for a classroom (role-aware)
// Teacher -> [{ _id, title, session, questionCount, responseCount, createdAt }]
// Student -> [{ _id, title, session, questionCount, createdAt, attempted, score }]
// ======================================
export const getClassroomQuizzes = async (classroomId) => {
  const response = await api.get(`/quizzes/classroom/${classroomId}`);

  return response.data;
};

// ======================================
// Get single quiz detail (role-aware)
// Teacher -> full quiz incl. correct answers + response count
// Student -> per-question right/wrong breakdown if attempted,
//            otherwise the questions with attempted: false
// ======================================
export const getQuizDetail = async (quizId) => {
  const response = await api.get(`/quizzes/${quizId}/detail`);

  return response.data;
};

// ======================================
// Teacher: open/close a quiz for students to self-attempt after the
// live session (also makes it visible to students at all, if it wasn't
// already launched live).
// ======================================
export const toggleQuizRetake = async (quizId, open) => {
  const response = await api.patch(`/quizzes/${quizId}/retake`, { open });

  return response.data; // { message, launched, openForRetake }
};
