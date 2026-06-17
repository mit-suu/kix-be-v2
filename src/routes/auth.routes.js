const express = require("express");
const {
    registerController,
    loginController,
    refreshTokenController,
    logoutController,
} = require("../controllers/auth.controllers");
const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/refresh", refreshTokenController);
router.post("/logout", logoutController);

module.exports = router;
