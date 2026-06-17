const Inventory = require("../models/inventory.model");
const InventoryHistory = require("../models/inventory-history.model");
const SKU = require("../models/sku.model");
const Store = require("../models/store.model");

/**
 * Lấy tồn kho theo store
 */
async function getInventoryByStore(storeId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    const [inventories, totalCount] = await Promise.all([
        Inventory.find({ store_id: storeId })
            .populate({
                path: "sku_id",
                populate: { path: "product_id", select: "name brand price images" },
            })
            .skip(skip)
            .limit(limit),
        Inventory.countDocuments({ store_id: storeId }),
    ]);

    return {
        inventories,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        },
    };
}

/**
 * Lấy tồn kho theo SKU (tại tất cả stores)
 */
async function getInventoryBySKU(skuId) {
    return await Inventory.find({ sku_id: skuId })
        .populate("store_id", "name address status");
}

/**
 * Cập nhật tồn kho trực tiếp (chỉ Admin)
 * Ghi log vào InventoryHistory với type = ADJUSTMENT
 */
async function updateInventory(storeId, skuId, quantity, note = "", userId = null) {
    // Validate store & sku
    const [store, sku] = await Promise.all([
        Store.findById(storeId),
        SKU.findById(skuId),
    ]);

    if (!store) throw new Error("Store not found");
    if (!sku) throw new Error("SKU not found");

    // Tìm hoặc tạo inventory record
    let inventory = await Inventory.findOne({ store_id: storeId, sku_id: skuId });
    const quantityBefore = inventory ? inventory.quantity : 0;

    if (!inventory) {
        inventory = await Inventory.create({
            store_id: storeId,
            sku_id: skuId,
            quantity,
        });
    } else {
        inventory.quantity = quantity;
        await inventory.save();
    }

    // Ghi lịch sử - Luôn là ADJUSTMENT khi admin sửa trực tiếp
    const quantityChange = quantity - quantityBefore;

    await InventoryHistory.create({
        store_id: storeId,
        sku_id: skuId,
        type: "ADJUSTMENT",
        quantity_change: quantityChange,
        quantity_before: quantityBefore,
        quantity_after: quantity,
        note: note || `Admin adjusted inventory to ${quantity}`,
        changed_by: userId,
    });

    return inventory;
}

/**
 * Assign SKU vào Store (tạo inventory record với quantity = 0)
 * Chỉ Admin
 */
async function assignSKUToStore(storeId, skuId) {
    const [store, sku] = await Promise.all([
        Store.findById(storeId),
        SKU.findById(skuId),
    ]);

    if (!store) throw new Error("Store not found");
    if (!sku) throw new Error("SKU not found");

    // Kiểm tra đã assign chưa
    const existing = await Inventory.findOne({ store_id: storeId, sku_id: skuId });
    if (existing) throw new Error("SKU already assigned to this store");

    return await Inventory.create({
        store_id: storeId,
        sku_id: skuId,
        quantity: 0,
    });
}

/**
 * Lấy lịch sử thay đổi tồn kho
 */
async function getInventoryHistory(storeId, skuId, { page = 1, limit = 20 } = {}) {
    const filter = {};
    if (storeId) filter.store_id = storeId;
    if (skuId) filter.sku_id = skuId;

    const skip = (page - 1) * limit;

    const [histories, totalCount] = await Promise.all([
        InventoryHistory.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("store_id", "name")
            .populate({
                path: "sku_id",
                populate: { path: "product_id", select: "name brand" },
            })
            .populate("changed_by", "name email"),
        InventoryHistory.countDocuments(filter),
    ]);

    return {
        histories,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        },
    };
}

module.exports = {
    getInventoryByStore,
    getInventoryBySKU,
    updateInventory,
    assignSKUToStore,
    getInventoryHistory,
};
