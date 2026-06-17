const express = require("express");
const { authenticate, authorize } = require("../middlewares/auth");
const {
    getColors,
    createColor,
    updateColor,
    deleteColor,
} = require("../controllers/color.controller");

const router = express.Router();

// ===== Public routes =====
// GET /api/v1/colors - Lấy tất cả colors
router.get("/", getColors);

// ===== Admin routes =====
// POST /api/v1/colors - Tạo color mới
router.post("/", authenticate, authorize("admin"), createColor);

// PUT /api/v1/colors/:id - Cập nhật color
router.put("/:id", authenticate, authorize("admin"), updateColor);

// DELETE /api/v1/colors/:id - Xóa color
router.delete("/:id", authenticate, authorize("admin"), deleteColor);

module.exports = router;
