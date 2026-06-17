const express = require("express");
const { authenticate, authorize } = require("../middlewares/auth");
const {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  validatePromoCode,
} = require("../controllers/promotion.controller");

const router = express.Router();

// Tất cả routes cần authenticate
router.use(authenticate);

// ===== Customer route (đặt trước /:id để tránh conflict) =====
router.post("/validate", validatePromoCode);

// ===== Admin routes =====
router.post("/", authorize("admin"), createPromotion);
router.get("/", authorize("admin"), getAllPromotions);
router.get("/:id", authorize("admin"), getPromotionById);
router.put("/:id", authorize("admin"), updatePromotion);
router.delete("/:id", authorize("admin"), deletePromotion);

module.exports = router;
