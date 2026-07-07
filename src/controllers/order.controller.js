const baseDTO = require("../dtos/base.dto");
const {
    orderResponseDTO,
    orderListResponseDTO,
    createOrderDTO,
} = require("../dtos/order.dto");
const orderService = require("../services/order.service");
const { createVnpayUrl, verifyVnpayReturn } = require("../utils/vnpay");

/**
 * POST /api/v1/orders/checkout
 * Tạo đơn hàng từ giỏ hàng (Customer)
 */
async function checkout(req, res) {
    try {
        const { isValid, errors, data } = createOrderDTO(req.body);

        if (!isValid) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Validation failed",
                    error: errors,
                })
            );
        }

        const order = await orderService.createOrder(req.user.userId, {
            ...data,
            payment_method: req.body.payment_method,
            promo_code: req.body.promo_code || null,
        });

        return res.status(201).json(
            baseDTO({
                success: true,
                message: "Order created successfully",
                data: orderResponseDTO(order),
            })
        );
    } catch (error) {
        console.error("CHECKOUT ERROR:", error);

        if (
            error.message.includes("empty") ||
            error.message.includes("not found") ||
            error.message.includes("not available") ||
            error.message.includes("Insufficient") ||
            error.message.includes("Promo") ||
            error.message.includes("promo")
        ) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: error.message,
                })
            );
        }

        return res.status(500).json(
            baseDTO({
                success: false,
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

/**
 * GET /api/v1/orders
 * Lấy danh sách đơn hàng của customer hiện tại
 */
async function getMyOrders(req, res) {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const result = await orderService.getOrdersByUserId(req.user.userId, {
            page: Number(page),
            limit: Number(limit),
            status,
        });

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Orders retrieved successfully",
                data: orderListResponseDTO(result.orders),
                meta: result.pagination,
            })
        );
    } catch (error) {
        console.error("GET MY ORDERS ERROR:", error);
        return res.status(500).json(
            baseDTO({
                success: false,
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

/**
 * GET /api/v1/orders/:id
 * Lấy chi tiết đơn hàng (Customer xem đơn của mình)
 */
async function getOrderDetail(req, res) {
    try {
        const order = await orderService.getOrderById(
            req.params.id,
            req.user.role === "customer" ? req.user.userId : null
        );

        if (!order) {
            return res.status(404).json(
                baseDTO({
                    success: false,
                    message: "Order not found",
                })
            );
        }

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Order retrieved successfully",
                data: orderResponseDTO(order),
            })
        );
    } catch (error) {
        console.error("GET ORDER DETAIL ERROR:", error);
        return res.status(500).json(
            baseDTO({
                success: false,
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

/**
 * PUT /api/v1/orders/:id/status
 * Cập nhật trạng thái đơn hàng (Admin/Store Manager)
 */
async function updateOrderStatus(req, res) {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Status is required",
                })
            );
        }

        const order = await orderService.updateOrderStatus(req.params.id, status);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: `Order status updated to "${status}"`,
                data: orderResponseDTO(order),
            })
        );
    } catch (error) {
        console.error("UPDATE ORDER STATUS ERROR:", error);

        if (error.message.includes("not found") || error.message.includes("Cannot change")) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: error.message,
                })
            );
        }

        return res.status(500).json(
            baseDTO({
                success: false,
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

/**
 * PUT /api/v1/orders/:id/cancel
 * Hủy đơn hàng (Customer - chỉ hủy khi pending)
 */
async function cancelOrder(req, res) {
    try {
        const order = await orderService.cancelOrder(req.params.id, req.user.userId);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Order cancelled successfully",
                data: orderResponseDTO(order),
            })
        );
    } catch (error) {
        console.error("CANCEL ORDER ERROR:", error);

        if (error.message.includes("not found") || error.message.includes("Can only cancel")) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: error.message,
                })
            );
        }

        return res.status(500).json(
            baseDTO({
                success: false,
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

/**
 * GET /api/v1/orders/admin/all
 * Lấy tất cả đơn hàng (Admin)
 */
async function getAllOrders(req, res) {
    try {
        const { page = 1, limit = 10, status, search } = req.query;

        const result = await orderService.getAllOrders({
            page: Number(page),
            limit: Number(limit),
            status,
            search,
        });

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "All orders retrieved successfully",
                data: orderListResponseDTO(result.orders),
                meta: result.pagination,
            })
        );
    } catch (error) {
        console.error("GET ALL ORDERS ERROR:", error);
        return res.status(500).json(
            baseDTO({
                success: false,
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

/**
 * POST /api/v1/orders/vnpay/create-url
 * Tạo đơn hàng + trả về URL thanh toán VNPay
 */
async function createVnpayPayment(req, res) {
    try {
        const { isValid, errors, data } = createOrderDTO(req.body);

        if (!isValid) {
            return res.status(400).json(
                baseDTO({ success: false, message: "Validation failed", error: errors })
            );
        }

        const order = await orderService.createOrder(req.user.userId, {
            ...data,
            payment_method: "vnpay",
            promo_code: req.body.promo_code || null,
        });

        const ipAddr =
            req.headers["x-forwarded-for"] ||
            req.socket?.remoteAddress ||
            "127.0.0.1";

        const paymentUrl = createVnpayUrl({
            tmnCode: process.env.VNPAY_TMN_CODE,
            secretKey: process.env.VNPAY_HASH_SECRET,
            vnpUrl: process.env.VNPAY_URL,
            returnUrl: process.env.VNPAY_RETURN_URL,
            orderId: order._id.toString(),
            amount: order.total,
            orderInfo: `KIX Order ${order.order_number}`,
            ipAddr: Array.isArray(ipAddr) ? ipAddr[0] : ipAddr,
            locale: req.body.locale || 'vn',
            bankCode: req.body.bank_code || '',
        });

        return res.status(201).json(
            baseDTO({
                success: true,
                message: "VNPay payment URL created",
                data: {
                    paymentUrl,
                    orderId: order._id,
                    orderNumber: order.order_number,
                },
            })
        );
    } catch (error) {
        console.error("CREATE VNPAY URL ERROR:", error);

        if (
            error.message.includes("empty") ||
            error.message.includes("not found") ||
            error.message.includes("not available") ||
            error.message.includes("Insufficient") ||
            error.message.includes("Promo") ||
            error.message.includes("promo")
        ) {
            return res.status(400).json(
                baseDTO({ success: false, message: error.message })
            );
        }

        return res.status(500).json(
            baseDTO({ success: false, message: "Server error" })
        );
    }
}

/**
 * GET /api/v1/orders/vnpay/return  (public — VNPay redirects here after payment)
 * Xác thực kết quả VNPay và redirect về frontend
 */
async function createPaymentServicePayment(req, res) {
    try {
        const { isValid, errors, data } = createOrderDTO(req.body);

        if (!isValid) {
            return res.status(400).json(
                baseDTO({ success: false, message: "Validation failed", error: errors })
            );
        }

        const order = await orderService.createPaymentServiceOrder(
            req.user.userId,
            {
                ...data,
                promo_code: req.body.promo_code || null,
            },
            req
        );

        return res.status(201).json(
            baseDTO({
                success: true,
                message: "Payment QR created",
                data: {
                    order: orderResponseDTO(order),
                    orderId: order._id,
                    orderNumber: order.order_number,
                    payment_order_id: order.payment_order_id,
                    payment_status: order.payment_status,
                    payment_description: order.payment_description,
                    payment_reference_code: order.payment_reference_code,
                    qr_code_url: order.payment_qr_code_url,
                },
            })
        );
    } catch (error) {
        console.error("CREATE PAYMENT SERVICE ORDER ERROR:", error);

        if (
            error.message.includes("empty") ||
            error.message.includes("not found") ||
            error.message.includes("not available") ||
            error.message.includes("Insufficient") ||
            error.message.includes("Promo") ||
            error.message.includes("promo") ||
            error.message.includes("Payment service")
        ) {
            return res.status(error.status || 400).json(
                baseDTO({ success: false, message: error.message, error: error.data })
            );
        }

        return res.status(500).json(
            baseDTO({ success: false, message: "Server error" })
        );
    }
}

async function paymentServiceCallback(req, res) {
    try {
        const { order_id, status, client_id } = req.body;

        if (!order_id || !status || !client_id) {
            return res.status(400).json(
                baseDTO({ success: false, message: "Missing fields" })
            );
        }

        if (status === "paid") {
            await orderService.markPaymentServiceOrderPaid(order_id, client_id);
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("PAYMENT SERVICE CALLBACK ERROR:", error);
        return res.status(error.status || 500).json(
            baseDTO({ success: false, message: error.message || "Server error" })
        );
    }
}

async function getPaymentServiceStatus(req, res) {
    try {
        const result = await orderService.syncPaymentServiceStatus(
            req.params.id,
            req.user.role === "customer" ? req.user.userId : null
        );

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Payment status retrieved successfully",
                data: {
                    order: orderResponseDTO(result.order),
                    payment: result.payment,
                },
            })
        );
    } catch (error) {
        console.error("GET PAYMENT SERVICE STATUS ERROR:", error);

        if (error.message.includes("not found")) {
            return res.status(404).json(
                baseDTO({ success: false, message: error.message })
            );
        }

        return res.status(error.status || 500).json(
            baseDTO({
                success: false,
                message: error.message || "Server error",
                error: error.data,
            })
        );
    }
}

async function vnpayReturn(req, res) {
    const query = req.query;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    const isValid = verifyVnpayReturn(query, process.env.VNPAY_HASH_SECRET);
    if (!isValid) {
        return res.redirect(
            `${clientUrl}/payment-result?status=failed&reason=invalid_signature`
        );
    }

    const responseCode = query.vnp_ResponseCode;
    const orderId = query.vnp_TxnRef;

    try {
        if (responseCode === "00") {
            await orderService.updatePaymentStatus(orderId, "success");
            return res.redirect(
                `${clientUrl}/payment-result?status=success&orderId=${orderId}`
            );
        } else {
            await orderService.updatePaymentStatus(orderId, "failed");
            return res.redirect(
                `${clientUrl}/payment-result?status=failed&orderId=${orderId}&code=${responseCode}`
            );
        }
    } catch (error) {
        console.error("VNPAY RETURN ERROR:", error);
        return res.redirect(
            `${clientUrl}/payment-result?status=failed&reason=server_error`
        );
    }
}

module.exports = {
    checkout,
    getMyOrders,
    getOrderDetail,
    updateOrderStatus,
    cancelOrder,
    getAllOrders,
    createVnpayPayment,
    createPaymentServicePayment,
    paymentServiceCallback,
    getPaymentServiceStatus,
    vnpayReturn,
};
