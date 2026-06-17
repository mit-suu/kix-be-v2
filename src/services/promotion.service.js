const Promotion = require("../models/promotion.model");

/**
 * Tạo promotion mới (Admin)
 */
async function createPromotion(data) {
  const existing = await Promotion.findOne({ code: data.code });
  if (existing) throw new Error("Promotion code already exists");

  const promotion = await Promotion.create(data);
  return promotion;
}

/**
 * Lấy danh sách promotions có phân trang (Admin)
 */
async function getAllPromotions({ page = 1, limit = 10, search, is_active } = {}) {
  const filter = {};
  if (search) {
    filter.$or = [
      { code: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  if (is_active !== undefined) {
    filter.is_active = is_active === "true" || is_active === true;
  }

  const skip = (page - 1) * limit;

  const [promotions, totalCount] = await Promise.all([
    Promotion.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Promotion.countDocuments(filter),
  ]);

  return {
    promotions,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

/**
 * Lấy promotion theo ID (Admin)
 */
async function getPromotionById(id) {
  const promotion = await Promotion.findById(id);
  return promotion;
}

/**
 * Cập nhật promotion (Admin)
 */
async function updatePromotion(id, data) {
  if (data.code) {
    const existing = await Promotion.findOne({ code: data.code, _id: { $ne: id } });
    if (existing) throw new Error("Promotion code already exists");
  }

  const promotion = await Promotion.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!promotion) throw new Error("Promotion not found");
  return promotion;
}

/**
 * Xóa promotion (Admin)
 */
async function deletePromotion(id) {
  const promotion = await Promotion.findByIdAndDelete(id);
  if (!promotion) throw new Error("Promotion not found");
  return promotion;
}

/**
 * Validate promo code và tính discount (Customer)
 * @param {string} code - Mã promo
 * @param {number} subtotal - Tổng tiền đơn hàng (trước thuế)
 * @returns {{ promotion, discount_amount }}
 */
async function validatePromoCode(code, subtotal) {
  const promotion = await Promotion.findOne({ code: code.toUpperCase() });

  if (!promotion) throw new Error("Promo code not found");
  if (!promotion.is_active) throw new Error("Promo code is inactive");

  const now = new Date();
  if (now < promotion.start_date) throw new Error("Promo code is not yet active");
  if (now > promotion.end_date) throw new Error("Promo code has expired");

  if (promotion.usage_limit !== null && promotion.used_count >= promotion.usage_limit) {
    throw new Error("Promo code usage limit reached");
  }

  if (subtotal < promotion.min_order_value) {
    throw new Error(`Minimum order value is ${promotion.min_order_value.toLocaleString()} VND`);
  }

  // Tính discount
  let discount_amount = 0;
  if (promotion.discount_type === "percentage") {
    discount_amount = Math.round(subtotal * (promotion.discount_value / 100));
    if (promotion.max_discount_amount !== null && discount_amount > promotion.max_discount_amount) {
      discount_amount = promotion.max_discount_amount;
    }
  } else {
    discount_amount = promotion.discount_value;
  }

  // Discount không vượt quá subtotal
  if (discount_amount > subtotal) {
    discount_amount = subtotal;
  }

  return {
    promotion,
    discount_amount,
  };
}

/**
 * Tăng used_count sau khi tạo order thành công
 */
async function incrementUsedCount(promotionId) {
  await Promotion.findByIdAndUpdate(promotionId, { $inc: { used_count: 1 } });
}

module.exports = {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  validatePromoCode,
  incrementUsedCount,
};
