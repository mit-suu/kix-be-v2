const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    phone: {
      type: String,
      default: null,
    },

    // Địa chỉ mặc định (dùng cho checkout)
    default_address: {
      recipient_name: { type: String },
      phone: { type: String },
      address: { type: String },
      ward: { type: String },
      district: { type: String },
      city: { type: String },
    },

    role: {
      type: String,
      enum: ["admin", "store_manager", "customer"],
      default: "customer",
    },

    // Chỉ dùng khi role = "store_manager"
    // Lưu danh sách stores mà user này quản lý
    managed_stores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);