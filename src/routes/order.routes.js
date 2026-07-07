const express = require("express");
const { authenticate, authorize } = require("../middlewares/auth");
const {
    checkout,
    getMyOrders,
    getOrderDetail,
    updateOrderStatus,
    cancelOrder,
    getAllOrders,
    createVnpayPayment,
    createPaymentServicePayment,
    getPaymentServiceStatus,
} = require("../controllers/order.controller");

const router = express.Router();

// Tất cả routes đều cần authenticate
router.use(authenticate);

// ===== Admin routes (đặt trước /:id để tránh conflict) =====
// GET    /api/v1/orders/admin/all   - Lấy tất cả đơn hàng
router.get("/admin/all", authorize("admin", "store_manager"), getAllOrders);

// ===== VNPay =====
// POST   /api/v1/orders/vnpay/create-url  - Tạo đơn hàng + URL thanh toán VNPay
router.post("/vnpay/create-url", createVnpayPayment);
router.post("/payment-service/create-order", createPaymentServicePayment);

// ===== Customer routes =====
// POST   /api/v1/orders/checkout    - Đặt hàng từ giỏ hàng
router.post("/checkout", checkout);

// GET    /api/v1/orders             - Lấy danh sách đơn hàng của mình
router.get("/", getMyOrders);
router.get("/:id/payment-status", getPaymentServiceStatus);

// GET    /api/v1/orders/:id         - Lấy chi tiết đơn hàng
router.get("/:id", getOrderDetail);

// PUT    /api/v1/orders/:id/cancel  - Hủy đơn hàng (chỉ khi pending)
router.put("/:id/cancel", cancelOrder);

// PUT    /api/v1/orders/:id/status  - Cập nhật trạng thái đơn hàng (Admin)
router.put("/:id/status", authorize("admin", "store_manager"), updateOrderStatus);

module.exports = router;
