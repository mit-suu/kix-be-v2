// const mongoose = require("mongoose"); // Không cần — standalone MongoDB không hỗ trợ transaction
const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Inventory = require("../models/inventory.model");
const InventoryHistory = require("../models/inventory-history.model");
const Product = require("../models/product.model");
const SKU = require("../models/sku.model");
const Store = require("../models/store.model");
const User = require("../models/user.model");
const promotionService = require("./promotion.service");

/**
 * Tạo mã đơn hàng unique
 */
function generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `KIX-${timestamp}-${random}`;
}

/**
 * Tạo đơn hàng từ giỏ hàng
 * - Validate tồn kho
 * - Trừ tồn kho
 * - Ghi lịch sử inventory
 * - Xóa giỏ hàng
 */
async function createOrder(userId, orderData) {
    // NOTE: Không dùng transaction vì MongoDB standalone không hỗ trợ.
    // Nếu sau này chuyển sang replica set, có thể wrap lại bằng session.startTransaction().

    // 1. Lấy user info
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // 2. Lấy giỏ hàng
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
    }

    // 3. Validate tất cả trước khi thực hiện thay đổi
    const orderItems = [];
    let total = 0;
    const inventoryUpdates = []; // lưu lại để rollback nếu cần

    for (const cartItem of cart.items) {
        // Lấy thông tin product, sku, store
        const [product, sku, store] = await Promise.all([
            Product.findById(cartItem.product_id),
            SKU.findById(cartItem.sku_id),
            Store.findById(cartItem.store_id),
        ]);

        if (!product || product.status !== "active") {
            throw new Error(`Product ${product?.name || cartItem.product_id} is not available`);
        }
        if (!sku) throw new Error("SKU not found");
        if (!store || store.status !== "active") {
            throw new Error(`Store ${store?.name || cartItem.store_id} is not available`);
        }

        // Kiểm tra tồn kho
        const inventory = await Inventory.findOne({
            store_id: cartItem.store_id,
            sku_id: cartItem.sku_id,
        });

        if (!inventory || inventory.quantity < cartItem.quantity) {
            throw new Error(
                `Insufficient stock for ${product.name} (${sku.color}, size ${sku.size}) at ${store.name}`
            );
        }

        const subtotal = cartItem.price * cartItem.quantity;
        total += subtotal;

        orderItems.push({
            product_id: cartItem.product_id,
            sku_id: cartItem.sku_id,
            store_id: cartItem.store_id,
            product_name: product.name,
            size: sku.size,
            color: sku.color,
            sku_code: sku.sku_code,
            store_name: store.name,
            quantity: cartItem.quantity,
            price: cartItem.price,
            subtotal,
        });

        inventoryUpdates.push({
            inventory,
            cartItem,
            user,
        });
    }

    // 4. Thực hiện trừ tồn kho (sau khi validate xong tất cả)
    for (const { inventory, cartItem, user: u } of inventoryUpdates) {
        const quantityBefore = inventory.quantity;
        inventory.quantity -= cartItem.quantity;
        await inventory.save();

        // Ghi lịch sử
        await InventoryHistory.create({
            store_id: cartItem.store_id,
            sku_id: cartItem.sku_id,
            type: "SOLD",
            quantity_change: -cartItem.quantity,
            quantity_before: quantityBefore,
            quantity_after: inventory.quantity,
            note: `Order placed by ${u.email}`,
        });
    }

    // 5. Tính thuế (8%)
    const TAX_RATE = 0.08;
    const subtotal = total;
    const tax = Math.round(subtotal * TAX_RATE);

    // 5.5. Áp dụng promo code (nếu có)
    let discount_amount = 0;
    let promo_code = null;
    let promotion_id = null;

    if (orderData.promo_code) {
        const promoResult = await promotionService.validatePromoCode(orderData.promo_code, subtotal);
        discount_amount = promoResult.discount_amount;
        promo_code = promoResult.promotion.code;
        promotion_id = promoResult.promotion._id;
    }

    const grandTotal = subtotal + tax - discount_amount;

    // 6. Tạo order
    const order = await Order.create({
        order_number: generateOrderNumber(),
        customer_id: userId,
        customer_email: user.email,
        customer_phone: user.phone || orderData.shipping_address?.phone,
        shipping_address: orderData.shipping_address,
        items: orderItems,
        subtotal,
        tax,
        discount_amount,
        promo_code,
        promotion_id,
        total: grandTotal,
        payment_method: orderData.payment_method || "vnpay",
        payment_status: "pending",
        status: "pending",
    });

    // 7. Tăng used_count của promotion (nếu có)
    if (promotion_id) {
        await promotionService.incrementUsedCount(promotion_id);
    }

    // 8. Xóa giỏ hàng
    cart.items = [];
    await cart.save();

    return order;
}

/**
 * Lấy danh sách đơn hàng của user
 */
async function getOrdersByUserId(userId, { page = 1, limit = 10, status } = {}) {
    const filter = { customer_id: userId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Order.countDocuments(filter),
    ]);

    return {
        orders,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        },
    };
}

/**
 * Lấy chi tiết đơn hàng
 */
async function getOrderById(orderId, userId = null) {
    const filter = { _id: orderId };
    if (userId) filter.customer_id = userId;

    const order = await Order.findOne(filter)
        .populate("items.product_id", "images imageUrl");
    return order;
}

/**
 * Cập nhật trạng thái đơn hàng (Admin/Store Manager)
 */
async function updateOrderStatus(orderId, status) {
    const validTransitions = {
        pending: ["paid", "cancelled"],
        paid: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
    };

    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");

    const allowedStatuses = validTransitions[order.status];
    if (!allowedStatuses || !allowedStatuses.includes(status)) {
        throw new Error(
            `Cannot change status from "${order.status}" to "${status}"`
        );
    }

    // Nếu cancel → hoàn lại tồn kho
    if (status === "cancelled") {
        await restoreInventory(order);
    }

    order.status = status;
    if (status === "paid") {
        order.payment_status = "success";
    }
    if (status === "cancelled") {
        order.payment_status = "failed";
    }

    await order.save();
    return order;
}

/**
 * Hoàn lại tồn kho khi hủy đơn
 */
async function restoreInventory(order) {
    for (const item of order.items) {
        const inventory = await Inventory.findOne({
            store_id: item.store_id,
            sku_id: item.sku_id,
        });

        if (inventory) {
            const quantityBefore = inventory.quantity;
            inventory.quantity += item.quantity;
            await inventory.save();

            await InventoryHistory.create({
                store_id: item.store_id,
                sku_id: item.sku_id,
                type: "ADJUSTMENT",
                quantity_change: item.quantity,
                quantity_before: quantityBefore,
                quantity_after: inventory.quantity,
                note: `Order ${order.order_number} cancelled - stock restored`,
            });
        }
    }
}

/**
 * Hủy đơn hàng (Customer - chỉ hủy khi pending)
 */
async function cancelOrder(orderId, userId) {
    const order = await Order.findOne({ _id: orderId, customer_id: userId });
    if (!order) throw new Error("Order not found");

    if (order.status !== "pending") {
        throw new Error("Can only cancel pending orders");
    }

    await restoreInventory(order);

    order.status = "cancelled";
    order.payment_status = "failed";
    await order.save();

    return order;
}

/**
 * Cập nhật payment_status sau khi xác thực VNPay callback
 * Gọi sau khi VNPay redirect về return URL
 */
async function updatePaymentStatus(orderId, paymentStatus) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    order.payment_status = paymentStatus;

    if (paymentStatus === 'success') {
        order.status = 'paid';
    }

    if (paymentStatus === 'failed' && order.status === 'pending') {
        order.status = 'cancelled';
        await restoreInventory(order);
    }

    await order.save();
    return order;
}

/**
 * Lấy tất cả đơn hàng (Admin)
 */
async function getAllOrders({ page = 1, limit = 10, status, search } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (search) {
        filter.$or = [
            { order_number: { $regex: search, $options: "i" } },
            { customer_email: { $regex: search, $options: "i" } },
        ];
    }

    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Order.countDocuments(filter),
    ]);

    return {
        orders,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        },
    };
}

module.exports = {
    createOrder,
    getOrdersByUserId,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    getAllOrders,
};
