const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    images: [
      {
        url: String,
        is_primary: { type: Boolean, default: false },
      },
    ],

    price: {
      type: Number,
      required: true,
      min: [1000, "Giá phải tối thiểu 1000 VND"],
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    rating: {
      type: Number,
      default: 0,
    },

    num_reviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
