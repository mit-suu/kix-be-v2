const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const SALT_ROUNDS = 10;

// ===== Token helpers =====
function generateAccessToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
}

// ===== Auth services =====
async function checkUserExists(email) {
  return await User.findOne({ email });
}

async function createUser({ email, password, name }) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    email,
    password: hashedPassword,
    name: name || null,
  });

  return user;
}

async function loginUser({ email, password }) {
  // 1. Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    return { success: false, message: "Email or password is incorrect" };
  }

  // 2. Compare password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return { success: false, message: "Email or password is incorrect" };
  }

  // 3. Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { success: true, user, accessToken, refreshToken };
}

async function refreshTokenService(token) {
  // 1. Verify refresh token
  const decoded = jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  );

  // 2. Check user still exists
  const user = await User.findById(decoded.userId);

  if (!user) {
    return { success: false, message: "User not found" };
  }

  // 3. Issue new access token
  const accessToken = generateAccessToken(user);

  return { success: true, accessToken, user };
}

module.exports = {
  checkUserExists,
  createUser,
  loginUser,
  refreshTokenService,
};