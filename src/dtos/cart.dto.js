// Cart DTOs

// Response DTO
function cartResponseDTO(cart) {
  if (!cart) return null;

  const items = cart.items.map((item) => ({
    id: item._id,
    product_id: item.product_id,
    sku_id: item.sku_id,
    store_id: item.store_id,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.price * item.quantity,
  }));

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    id: cart._id,
    user_id: cart.user_id,
    items,
    total,
    item_count: items.reduce((count, item) => count + item.quantity, 0),
  };
}

// Add to Cart DTO
function addToCartDTO(data) {
  const errors = [];

  if (!data.product_id) errors.push("product_id is required");
  if (!data.sku_id) errors.push("sku_id is required");
  if (!data.store_id) errors.push("store_id is required");
  if (!data.quantity || data.quantity < 1) {
    errors.push("Quantity must be at least 1");
  }
  if (data.quantity > 10) {
    errors.push("Maximum 10 items per product");
  }
  if (!data.price || Number(data.price) < 1000) {
    errors.push("Giá phải tối thiểu 1000 VND");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      product_id: data.product_id,
      sku_id: data.sku_id,
      store_id: data.store_id,
      quantity: Number(data.quantity),
      price: Number(data.price),
    },
  };
}

// Update Cart Item DTO
function updateCartItemDTO(data) {
  const errors = [];

  if (!data.quantity || data.quantity < 1) {
    errors.push("Quantity must be at least 1");
  }
  if (data.quantity > 10) {
    errors.push("Maximum 10 items per product");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      quantity: Number(data.quantity),
    },
  };
}

module.exports = {
  cartResponseDTO,
  addToCartDTO,
  updateCartItemDTO,
};
