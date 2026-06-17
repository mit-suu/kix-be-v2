const baseDTO = require("../dtos/base.dto");
const {
  createUserDTO,
  loginDTO,
  userResponseDTO,
} = require("../dtos/user.dto");
const {
  checkUserExists,
  createUser,
  loginUser,
  refreshTokenService,
} = require("../services/auth-service");

// Cookie options cho refresh token
const isProduction = process.env.NODE_ENV === "production";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,                          // JS không đọc được → chống XSS
  secure: isProduction,                    // chỉ gửi qua HTTPS ở production
  sameSite: isProduction ? "none" : "strict", // "none" cho cross-origin (Vercel→Azure), "strict" ở local
  path: "/",                               // áp dụng cho toàn bộ domain
  maxAge: 7 * 24 * 60 * 60 * 1000,        // 7 ngày (ms)
};

async function registerController(req, res) {
  try {

    const { isValid, errors, data } = createUserDTO(req.body);

    if (!isValid) {
      return res.status(400).json(
        baseDTO({
          success: false,
          message: "Validation failed",
          errors,
        })
      );
    }

    const existingUser = await checkUserExists(data.email);

    if (existingUser) {
      return res.status(409).json(
        baseDTO({
          success: false,
          message: "Email already exists",
        })
      );
    }
    const newUser = await createUser(data);
    return res.status(201).json(
      baseDTO({
        success: true,
        message: "Register successfully",
        data: userResponseDTO(newUser),
      })
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json(
      baseDTO({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      })
    );
  }
}

async function loginController(req, res) {
  try {
    // 1. Validate input
    const { isValid, errors, data } = loginDTO(req.body);

    if (!isValid) {
      return res.status(400).json(
        baseDTO({
          success: false,
          message: "Validation failed",
          errors,
        })
      );
    }

    // 2. Attempt login
    const result = await loginUser(data);

    if (!result.success) {
      return res.status(401).json(
        baseDTO({
          success: false,
          message: result.message,
        })
      );
    }

    // 3. Lưu refresh token vào httpOnly cookie
    res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

    // 4. Trả về access token + user info (KHÔNG trả refreshToken trong body)
    return res.status(200).json(
      baseDTO({
        success: true,
        message: "Login successfully",
        data: {
          user: userResponseDTO(result.user),
          accessToken: result.accessToken,
        },
      })
    );
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json(
      baseDTO({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      })
    );
  }
}

async function refreshTokenController(req, res) {
  try {
    // 1. Đọc refresh token từ cookie
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json(
        baseDTO({
          success: false,
          message: "Refresh token not found",
        })
      );
    }

    // 2. Verify & issue new access token
    const result = await refreshTokenService(token);

    if (!result.success) {
      // Xóa cookie nếu token không hợp lệ
      res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
      return res.status(403).json(
        baseDTO({
          success: false,
          message: result.message,
        })
      );
    }

    // 3. Trả về access token mới
    return res.status(200).json(
      baseDTO({
        success: true,
        message: "Token refreshed successfully",
        data: {
          accessToken: result.accessToken,
        },
      })
    );
  } catch (error) {
    console.error("REFRESH TOKEN ERROR:", error);

    // Token expired hoặc invalid → xóa cookie
    res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);

    return res.status(403).json(
      baseDTO({
        success: false,
        message: "Invalid or expired refresh token",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      })
    );
  }
}

async function logoutController(req, res) {
  try {
    // Xóa refresh token cookie
    res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);

    return res.status(200).json(
      baseDTO({
        success: true,
        message: "Logout successfully",
      })
    );
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return res.status(500).json(
      baseDTO({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      })
    );
  }
}

module.exports = {
  registerController,
  loginController,
  refreshTokenController,
  logoutController,
};