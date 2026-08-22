const analyticsService = require("./analytics.service");

function handleError(res, err) {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Something went wrong" });
}

exports.getOverview = async (req, res) => {
  try {
    const { classroomId, from, to } = req.query;
    const data = await analyticsService.getOverview({
      teacherId: req.user.id,
      classroomId,
      from,
      to,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getAttendanceAnalytics = async (req, res) => {
  try {
    const { classroomId, from, to, page, limit, sort, order, search, status } =
      req.query;
    const data = await analyticsService.getAttendanceAnalytics({
      teacherId: req.user.id,
      classroomId,
      from,
      to,
      page,
      limit,
      sort,
      order,
      search,
      status,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getSessionAnalytics = async (req, res) => {
  try {
    const { classroomId, from, to, groupBy, page, limit, sort, order, search } =
      req.query;
    const data = await analyticsService.getSessionAnalytics({
      teacherId: req.user.id,
      classroomId,
      from,
      to,
      groupBy,
      page,
      limit,
      sort,
      order,
      search,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getQuizAnalytics = async (req, res) => {
  try {
    const { classroomId, from, to, quizId, page, limit, sort, order, search } =
      req.query;
    const data = await analyticsService.getQuizAnalytics({
      teacherId: req.user.id,
      classroomId,
      from,
      to,
      quizId,
      page,
      limit,
      sort,
      order,
      search,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getClassComparison = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await analyticsService.getClassComparison({
      teacherId: req.user.id,
      from,
      to,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getStudentDetail = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await analyticsService.getStudentDetail({
      teacherId: req.user.id,
      studentId: req.params.studentId,
      from,
      to,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getMyAnalytics = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await analyticsService.getMyAnalytics({
      studentId: req.user.id,
      from,
      to,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
};
