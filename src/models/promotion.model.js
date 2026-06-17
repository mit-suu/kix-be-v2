const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Promotion code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    discount_type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type is required"],
    },

    discount_value: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value must be positive"],
    },

    min_order_value: {
      type: Number,
      default: 0,
    },

    max_discount_amount: {
      type: Number,
      default: null,
    },

    start_date: {
      type: Date,
      required: [true, "Start date is required"],
    },

    end_date: {
      type: Date,
      required: [true, "End date is required"],
    },

    usage_limit: {
      type: Number,
      default: null,
    },

    used_count: {
      type: Number,
      default: 0,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Promotion", promotionSchema);
