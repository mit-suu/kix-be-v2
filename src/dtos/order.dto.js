// Order DTOs

// Response DTO
function orderResponseDTO(order) {
  if (!order) return null;

  return {
    id: order._id,
    order_number: order.order_number,
    customer_id: order.customer_id,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    shipping_address: {
      recipient_name: order.shipping_address?.recipient_name,
      phone: order.shipping_address?.phone,
      address: order.shipping_address?.address,
      ward: order.shipping_address?.ward,
      district: order.shipping_address?.district,
      city: order.shipping_address?.city,
    },
    items: order.items.map((item) => {
      const pid = item.product_id;
      const productImage = (pid && typeof pid === 'object' && pid.images?.length > 0)
        ? pid.images.find(img => img.is_primary)?.url || pid.images[0].url
        : (pid && typeof pid === 'object' && pid.imageUrl) || null;

      return {
        id: item._id,
        product_id: pid && typeof pid === 'object' ? pid._id : pid,
        product_image: productImage,
        product_name: item.product_name,
        size: item.size,
        color: item.color,
        sku_code: item.sku_code,
        store_name: item.store_name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      };
    }),
    total: order.total,
    subtotal: order.subtotal,
    tax: order.tax,
    discount_amount: order.discount_amount || 0,
    promo_code: order.promo_code || null,
    promotion_id: order.promotion_id || null,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    status: order.status,
    createdAt: order.createdAt,
  };
}

// Order List Response
function orderListResponseDTO(orders) {
  return orders.map(orderResponseDTO);
}

// Create Order DTO
function createOrderDTO(data) {
  const errors = [];

  // Validate shipping address
  if (!data.shipping_address) {
    errors.push("Shipping address is required");
  } else {
    if (!data.shipping_address.recipient_name) {
      errors.push("Recipient name is required");
    }
    if (!data.shipping_address.phone) {
      errors.push("Phone is required");
    } else if (!/^0\d{9}$/.test(data.shipping_address.phone)) {
      errors.push("Phone must be 10 digits starting with 0");
    }
    if (!data.shipping_address.address) {
      errors.push("Address is required");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      shipping_address: {
        recipient_name: data.shipping_address?.recipient_name?.trim(),
        phone: data.shipping_address?.phone?.trim(),
        address: data.shipping_address?.address?.trim(),
        ward: data.shipping_address?.ward?.trim() || "",
        district: data.shipping_address?.district?.trim() || "",
        city: data.shipping_address?.city?.trim() || "",
      },
      promo_code: data.promo_code?.trim().toUpperCase() || null,
    },
  };
}

module.exports = {
  orderResponseDTO,
  orderListResponseDTO,
  createOrderDTO,
};
