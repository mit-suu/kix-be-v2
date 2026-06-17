const mongoose = require("mongoose");

const skuSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    color: {
      type: String,
      required: true,
    },

    color_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
      default: null,
    },

    sku_code: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SKU", skuSchema);

