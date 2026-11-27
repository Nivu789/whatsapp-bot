const { loginAdmin } = require("../services/auth.service");

const isProduction =
    process.env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    const { token, admin } = await loginAdmin(email, password);

    res.cookie("accessToken", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie("accessToken", cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.admin,
  });
};

module.exports = {
  login,
  logout,
  getMe,
};