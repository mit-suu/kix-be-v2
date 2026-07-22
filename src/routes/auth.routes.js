const express = require("express");
const {
    registerController,
    loginController,
    refreshTokenController,
    logoutController,
} = require("../controllers/auth.controllers");
const router = express.Router();

/**
 * @route POST /register
 * @description Register a new user
 * @returns {Object} 201 - User registered successfully
 * @returns {Object} 400 - Invalid input or user already exists
 * @returns {Object} 500 - Server error
 */
router.post("/register", registerController);

/**
 * @route POST /login
 * @description Login user and return authentication tokens
 * @returns {Object} 200 - Login successful
 * @returns {Object} 401 - Invalid credentials
 * @returns {Object} 500 - Server error
 */
router.post("/login", loginController);

/**
 * @route POST /refresh
 * @description Refresh authentication token
 * @returns {Object} 200 - Token refreshed successfully
 * @returns {Object} 401 - Invalid or expired refresh token
 * @returns {Object} 500 - Server error
 */
router.post("/refresh", refreshTokenController);

/**
 * @route POST /logout
 * @description Logout user
 * @returns {Object} 200 - Logout successful
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 500 - Server error
 */
router.post("/logout", logoutController);

module.exports = router;