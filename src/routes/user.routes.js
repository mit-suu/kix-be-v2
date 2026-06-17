const express = require("express");
const { authenticate, authorize } = require("../middlewares/auth");
const { uploadAvatar } = require("../config/cloudinary");
const {
    getProfile,
    updateProfile,
    getUsers,
    updateUserRole,
} = require("../controllers/user.controller");

const router = express.Router();

// ===== Authenticated routes =====
// GET    /api/v1/users/profile      - Lấy profile của user hiện tại
router.get("/profile", authenticate, getProfile);

// PUT    /api/v1/users/profile      - Cập nhật profile (upload avatar qua Cloudinary)
router.put("/profile", authenticate, uploadAvatar, updateProfile);

// ===== Admin routes =====
// GET    /api/v1/users              - Lấy danh sách users
router.get("/", authenticate, authorize("admin"), getUsers);

// PUT    /api/v1/users/:id/role     - Cập nhật role
router.put("/:id/role", authenticate, authorize("admin"), updateUserRole);

module.exports = router;
