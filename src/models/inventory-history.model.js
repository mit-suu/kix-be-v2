const mongoose = require("mongoose");

const inventoryHistorySchema = new mongoose.Schema(
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

    // IMPORT = nhập hàng qua phiếu
    // TRANSFER_IN = nhận hàng chuyển kho
    // TRANSFER_OUT = gửi hàng chuyển kho
    // SOLD = bán hàng
    // ADJUSTMENT = admin sửa trực tiếp
    type: {
      type: String,
      enum: ["SOLD", "RESTOCK", "ADJUSTMENT", "IMPORT", "TRANSFER_IN", "TRANSFER_OUT"],
      required: true,
    },

    quantity_change: {
      type: Number,
      required: true,
    },

    quantity_before: {
      type: Number,
      required: true,
    },

    quantity_after: {
      type: Number,
      required: true,
    },

    note: {
      type: String,
    },

    // Người thực hiện thay đổi
    changed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Liên kết tới phiếu (nếu có)
    ticket_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockTicket",
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model("InventoryHistory", inventoryHistorySchema);
