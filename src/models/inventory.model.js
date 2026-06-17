const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    sku_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SKU",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 1 SKU tại 1 Store chỉ có 1 record
inventorySchema.index({ store_id: 1, sku_id: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);
