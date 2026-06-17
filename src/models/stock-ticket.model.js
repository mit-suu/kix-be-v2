const mongoose = require("mongoose");

const stockTicketItemSchema = new mongoose.Schema(
    {
        sku_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SKU",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    { _id: false }
);

const stockTicketSchema = new mongoose.Schema(
    {
        // "IMPORT" = Phiếu Nhập Hàng, "TRANSFER" = Phiếu Chuyển Kho
        type: {
            type: String,
            enum: ["IMPORT", "TRANSFER"],
            required: true,
        },

        // Store nhận hàng (dùng cho cả IMPORT và TRANSFER)
        to_store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
        },

        // Store gửi hàng (chỉ dùng cho TRANSFER)
        from_store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            default: null,
        },

        // Danh sách SKU + số lượng
        items: {
            type: [stockTicketItemSchema],
            required: true,
            validate: {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: "At least one item is required",
            },
        },

        // Trạng thái phiếu
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled"],
            default: "pending",
        },

        // Ghi chú
        note: {
            type: String,
            default: "",
        },

        // Người tạo phiếu
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Người confirm phiếu
        confirmed_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // Người hủy phiếu
        cancelled_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        confirmed_at: {
            type: Date,
            default: null,
        },

        cancelled_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("StockTicket", stockTicketSchema);
