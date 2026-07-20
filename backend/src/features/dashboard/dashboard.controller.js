const { getDashboardData } = require("./dashboard.service");

const getDashboard = async (req, res) => {
  try {
    const data = await getDashboardData(req.user);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};

module.exports = {
  getDashboard,
};
