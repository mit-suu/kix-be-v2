const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    sku_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SKU",
    },

    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },

    product_name: String,
    size: Number,
    color: String,
    sku_code: String,
    store_name: String,

    quantity: {
      type: Number,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: [1000, "Giá phải tối thiểu 1000 VND"],
    },

    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    order_number: {
      type: String,
      required: true,
      unique: true,
    },

    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customer_email: String,
    customer_phone: String,

    shipping_address: {
      recipient_name: String,
      phone: String,
      address: String,
      ward: String,
      district: String,
      city: String,
    },

    items: [orderItemSchema],

    subtotal: {
      type: Number,
      required: true,
    },

    tax: {
      type: Number,
      default: 0,
    },

    discount_amount: {
      type: Number,
      default: 0,
    },

    promo_code: {
      type: String,
      default: null,
    },

    promotion_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      default: null,
    },

    total: {
      type: Number,
      required: true,
    },

    payment_method: {
      type: String,
      default: "vnpay",
    },

    payment_status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
