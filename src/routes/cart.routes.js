const express = require("express");
const { authenticate } = require("../middlewares/auth");
const {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
} = require("../controllers/cart.controller");

const router = express.Router();

// Tất cả routes đều cần authenticate
router.use(authenticate);

// GET    /api/v1/cart              - Lấy giỏ hàng
router.get("/", getCart);

// POST   /api/v1/cart/items        - Thêm sản phẩm vào giỏ
router.post("/items", addToCart);

// PUT    /api/v1/cart/items/:itemId - Cập nhật số lượng
router.put("/items/:itemId", updateCartItem);

// DELETE /api/v1/cart/items/:itemId - Xóa item khỏi giỏ
router.delete("/items/:itemId", removeCartItem);

// DELETE /api/v1/cart              - Xóa toàn bộ giỏ hàng
router.delete("/", clearCart);

module.exports = router;
