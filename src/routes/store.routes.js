const express = require("express");
const { authenticate, authorize, optionalAuth } = require("../middlewares/auth");
const { uploadStoreImage } = require("../config/cloudinary");
const {
    getStores,
    getStoreDetail,
    createStore,
    updateStore,
    deleteStore,
} = require("../controllers/store.controller");

const router = express.Router();

// ===== Public routes =====
// GET    /api/v1/stores             - Lấy danh sách stores
router.get("/", optionalAuth, getStores);

// GET    /api/v1/stores/:id         - Lấy chi tiết store
router.get("/:id", getStoreDetail);

// ===== Admin routes =====
// POST   /api/v1/stores             - Tạo store mới
router.post("/", authenticate, authorize("admin"), uploadStoreImage, createStore);

// PUT    /api/v1/stores/:id         - Cập nhật store
router.put("/:id", authenticate, authorize("admin"), uploadStoreImage, updateStore);

// DELETE /api/v1/stores/:id         - Xóa store
router.delete("/:id", authenticate, authorize("admin"), deleteStore);

module.exports = router;
