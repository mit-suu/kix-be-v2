// Promotion DTOs

// Response DTO
function promotionResponseDTO(promotion) {
  if (!promotion) return null;

  return {
    id: promotion._id,
    code: promotion.code,
    description: promotion.description,
    discount_type: promotion.discount_type,
    discount_value: promotion.discount_value,
    min_order_value: promotion.min_order_value,
    max_discount_amount: promotion.max_discount_amount,
    start_date: promotion.start_date,
    end_date: promotion.end_date,
    usage_limit: promotion.usage_limit,
    used_count: promotion.used_count,
    is_active: promotion.is_active,
    createdAt: promotion.createdAt,
  };
}

// Promotion List Response
function promotionListResponseDTO(promotions) {
  return promotions.map(promotionResponseDTO);
}

// Create Promotion DTO (validation)
function createPromotionDTO(data) {
  const errors = [];

  if (!data.code || !data.code.trim()) errors.push("Promotion code is required");
  if (!data.discount_type || !["percentage", "fixed"].includes(data.discount_type)) {
    errors.push("Discount type must be 'percentage' or 'fixed'");
  }
  if (data.discount_value === undefined || Number(data.discount_value) <= 0) {
    errors.push("Discount value must be greater than 0");
  }
  if (data.discount_type === "percentage" && Number(data.discount_value) > 100) {
    errors.push("Percentage discount cannot exceed 100");
  }
  if (!data.start_date) errors.push("Start date is required");
  if (!data.end_date) errors.push("End date is required");
  if (data.start_date && data.end_date && new Date(data.start_date) >= new Date(data.end_date)) {
    errors.push("End date must be after start date");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      code: data.code?.trim().toUpperCase(),
      description: data.description?.trim() || "",
      discount_type: data.discount_type,
      discount_value: Number(data.discount_value),
      min_order_value: Number(data.min_order_value) || 0,
      max_discount_amount: data.max_discount_amount ? Number(data.max_discount_amount) : null,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      usage_limit: data.usage_limit ? Number(data.usage_limit) : null,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    },
  };
}

// Update Promotion DTO (partial)
function updatePromotionDTO(data) {
  if (!data) data = {};
  const cleanData = {};

  if (data.code !== undefined) cleanData.code = data.code?.trim().toUpperCase();
  if (data.description !== undefined) cleanData.description = data.description?.trim();
  if (data.discount_type !== undefined) cleanData.discount_type = data.discount_type;
  if (data.discount_value !== undefined) cleanData.discount_value = Number(data.discount_value);
  if (data.min_order_value !== undefined) cleanData.min_order_value = Number(data.min_order_value);
  if (data.max_discount_amount !== undefined) cleanData.max_discount_amount = data.max_discount_amount ? Number(data.max_discount_amount) : null;
  if (data.start_date !== undefined) cleanData.start_date = new Date(data.start_date);
  if (data.end_date !== undefined) cleanData.end_date = new Date(data.end_date);
  if (data.usage_limit !== undefined) cleanData.usage_limit = data.usage_limit ? Number(data.usage_limit) : null;
  if (data.is_active !== undefined) cleanData.is_active = Boolean(data.is_active);

  return cleanData;
}

// Validate Promo Code DTO (for customer input)
function validatePromoCodeDTO(data) {
  const errors = [];
  if (!data.code || !data.code.trim()) errors.push("Promo code is required");

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      code: data.code?.trim().toUpperCase(),
    },
  };
}

module.exports = {
  promotionResponseDTO,
  promotionListResponseDTO,
  createPromotionDTO,
  updatePromotionDTO,
  validatePromoCodeDTO,
};
