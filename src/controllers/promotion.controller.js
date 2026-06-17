const baseDTO = require("../dtos/base.dto");
const {
  promotionResponseDTO,
  promotionListResponseDTO,
  createPromotionDTO,
  updatePromotionDTO,
  validatePromoCodeDTO,
} = require("../dtos/promotion.dto");
const promotionService = require("../services/promotion.service");
const cartService = require("../services/cart.service");

/**
 * POST /api/v1/promotions
 * Tạo promotion mới (Admin)
 */
async function createPromotion(req, res) {
  try {
    const { isValid, errors, data } = createPromotionDTO(req.body);
    if (!isValid) {
      return res.status(400).json(
        baseDTO({ success: false, message: "Validation failed", error: errors })
      );
    }
    const promotion = await promotionService.createPromotion(data);
    return res.status(201).json(
      baseDTO({
        success: true,
        message: "Promotion created successfully",
        data: promotionResponseDTO(promotion),
      })
    );
  } catch (error) {
    console.error("CREATE PROMOTION ERROR:", error);
    if (error.message.includes("already exists")) {
      return res.status(400).json(
        baseDTO({ success: false, message: error.message })
      );
    }
    return res.status(500).json(
      baseDTO({
        success: false,
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    );
  }
}

/**
 * GET /api/v1/promotions
 * Lấy danh sách promotions (Admin)
 */
async function getAllPromotions(req, res) {
  try {
    const { page = 1, limit = 10, search, is_active } = req.query;
    const result = await promotionService.getAllPromotions({
      page: Number(page),
      limit: Number(limit),
      search,
      is_active,
    });
    return res.status(200).json(
      baseDTO({
        success: true,
        message: "Promotions retrieved successfully",
        data: promotionListResponseDTO(result.promotions),
        meta: result.pagination,
      })
    );
  } catch (error) {
    console.error("GET PROMOTIONS ERROR:", error);
    return res.status(500).json(
      baseDTO({
        success: false,
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    );
  }
}

/**
 * GET /api/v1/promotions/:id
 * Lấy promotion theo ID (Admin)
 */
async function getPromotionById(req, res) {
  try {
    const promotion = await promotionService.getPromotionById(req.params.id);
    if (!promotion) {
      return res.status(404).json(
        baseDTO({ success: false, message: "Promotion not found" })
      );
    }
    return res.status(200).json(
      baseDTO({
        success: true,
        message: "Promotion retrieved successfully",
        data: promotionResponseDTO(promotion),
      })
    );
  } catch (error) {
    console.error("GET PROMOTION ERROR:", error);
    return res.status(500).json(
      baseDTO({
        success: false,
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    );
  }
}

/**
 * PUT /api/v1/promotions/:id
 * Cập nhật promotion (Admin)
 */
async function updatePromotion(req, res) {
  try {
    const cleanData = updatePromotionDTO(req.body);
    const promotion = await promotionService.updatePromotion(req.params.id, cleanData);
    return res.status(200).json(
      baseDTO({
        success: true,
        message: "Promotion updated successfully",
        data: promotionResponseDTO(promotion),
      })
    );
  } catch (error) {
    console.error("UPDATE PROMOTION ERROR:", error);
    if (error.message.includes("not found") || error.message.includes("already exists")) {
      return res.status(400).json(
        baseDTO({ success: false, message: error.message })
      );
    }
    return res.status(500).json(
      baseDTO({
        success: false,
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    );
  }
}

/**
 * DELETE /api/v1/promotions/:id
 * Xóa promotion (Admin)
 */
async function deletePromotion(req, res) {
  try {
    await promotionService.deletePromotion(req.params.id);
    return res.status(200).json(
      baseDTO({ success: true, message: "Promotion deleted successfully" })
    );
  } catch (error) {
    console.error("DELETE PROMOTION ERROR:", error);
    if (error.message.includes("not found")) {
      return res.status(404).json(
        baseDTO({ success: false, message: error.message })
      );
    }
    return res.status(500).json(
      baseDTO({
        success: false,
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    );
  }
}

/**
 * POST /api/v1/promotions/validate
 * Validate promo code và preview discount (Customer)
 */
async function validatePromoCode(req, res) {
  try {
    const { isValid, errors, data } = validatePromoCodeDTO(req.body);
    if (!isValid) {
      return res.status(400).json(
        baseDTO({ success: false, message: "Validation failed", error: errors })
      );
    }

    // Lấy cart subtotal để tính discount preview
    const cart = await cartService.getCartByUserId(req.user.userId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json(
        baseDTO({ success: false, message: "Cart is empty" })
      );
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const result = await promotionService.validatePromoCode(data.code, subtotal);

    return res.status(200).json(
      baseDTO({
        success: true,
        message: "Promo code is valid",
        data: {
          code: result.promotion.code,
          discount_type: result.promotion.discount_type,
          discount_value: result.promotion.discount_value,
          discount_amount: result.discount_amount,
          description: result.promotion.description,
        },
      })
    );
  } catch (error) {
    console.error("VALIDATE PROMO ERROR:", error);
    return res.status(400).json(
      baseDTO({ success: false, message: error.message })
    );
  }
}

module.exports = {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  validatePromoCode,
};
