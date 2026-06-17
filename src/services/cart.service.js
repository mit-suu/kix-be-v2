const Cart = require("../models/cart.model");
const Inventory = require("../models/inventory.model");
const Product = require("../models/product.model");
const SKU = require("../models/sku.model");
const Store = require("../models/store.model");

/**
 * Lấy giỏ hàng của user (tự tạo nếu chưa có)
 */
async function getCartByUserId(userId) {
    let cart = await Cart.findOne({ user_id: userId })
        .populate("items.product_id", "name brand images price")
        .populate("items.sku_id", "size color sku_code")
        .populate("items.store_id", "name address");

    if (!cart) {
        cart = await Cart.create({ user_id: userId, items: [] });
    }

    return cart;
}

/**
 * Thêm sản phẩm vào giỏ hàng
 */
async function addItemToCart(userId, itemData) {
    const { product_id, sku_id, store_id, quantity, price } = itemData;

    // Kiểm tra product, sku, store tồn tại
    const [product, sku, store] = await Promise.all([
        Product.findById(product_id),
        SKU.findById(sku_id),
        Store.findById(store_id),
    ]);

    if (!product) throw new Error("Product not found");
    if (product.status !== "active") throw new Error("Product is not available");
    if (!sku) throw new Error("SKU not found");
    if (!store) throw new Error("Store not found");
    if (store.status !== "active") throw new Error("Store is not available");

    // Kiểm tra tồn kho
    const inventory = await Inventory.findOne({ store_id, sku_id });
    if (!inventory || inventory.quantity < quantity) {
        throw new Error("Insufficient stock");
    }

    // Tìm hoặc tạo cart
    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        cart = await Cart.create({ user_id: userId, items: [] });
    }

    // Kiểm tra item đã tồn tại trong cart chưa (cùng sku + cùng store)
    const existingItemIndex = cart.items.findIndex(
        (item) =>
            item.sku_id.toString() === sku_id &&
            item.store_id.toString() === store_id
    );

    if (existingItemIndex > -1) {
        // Cập nhật quantity
        const newQty = cart.items[existingItemIndex].quantity + quantity;
        if (newQty > 10) throw new Error("Maximum 10 items per product");
        if (newQty > inventory.quantity) throw new Error("Insufficient stock");

        cart.items[existingItemIndex].quantity = newQty;
        cart.items[existingItemIndex].price = price;
    } else {
        // Thêm item mới
        cart.items.push({
            product_id,
            sku_id,
            store_id,
            quantity,
            price,
        });
    }

    await cart.save();

    // Populate lại trước khi trả về
    return await Cart.findById(cart._id)
        .populate("items.product_id", "name brand images price")
        .populate("items.sku_id", "size color sku_code")
        .populate("items.store_id", "name address");
}

/**
 * Cập nhật số lượng item trong giỏ hàng
 */
async function updateCartItem(userId, itemId, quantity) {
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) throw new Error("Cart not found");

    const item = cart.items.id(itemId);
    if (!item) throw new Error("Item not found in cart");

    // Kiểm tra tồn kho
    const inventory = await Inventory.findOne({
        store_id: item.store_id,
        sku_id: item.sku_id,
    });

    if (!inventory || inventory.quantity < quantity) {
        throw new Error("Insufficient stock");
    }

    item.quantity = quantity;
    await cart.save();

    return await Cart.findById(cart._id)
        .populate("items.product_id", "name brand images price")
        .populate("items.sku_id", "size color sku_code")
        .populate("items.store_id", "name address");
}

/**
 * Xóa item khỏi giỏ hàng
 */
async function removeCartItem(userId, itemId) {
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) throw new Error("Cart not found");

    const item = cart.items.id(itemId);
    if (!item) throw new Error("Item not found in cart");

    cart.items.pull(itemId);
    await cart.save();

    return await Cart.findById(cart._id)
        .populate("items.product_id", "name brand images price")
        .populate("items.sku_id", "size color sku_code")
        .populate("items.store_id", "name address");
}

/**
 * Xóa toàn bộ giỏ hàng
 */
async function clearCart(userId) {
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) throw new Error("Cart not found");

    cart.items = [];
    await cart.save();

    return cart;
}

module.exports = {
    getCartByUserId,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
};
