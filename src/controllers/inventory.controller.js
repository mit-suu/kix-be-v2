const baseDTO = require("../dtos/base.dto");
const {
    inventoryResponseDTO,
    inventoryListResponseDTO,
    updateInventoryDTO,
    inventoryHistoryListResponseDTO,
} = require("../dtos/inventory.dto");
const inventoryService = require("../services/inventory.service");
const Store = require("../models/store.model");

/**
 * GET /api/v1/inventory/store/:storeId
 * Lấy tồn kho theo store (Admin/Store Manager)
 * Store Manager chỉ xem store mình quản lý
 */
async function getInventoryByStore(req, res) {
    try {
        // Store Manager chỉ xem store mình quản lý
        if (req.user.role === "store_manager") {
            const managedStores = await Store.find({ manager_id: req.user._id }).select("_id");
            const managedStoreIds = managedStores.map((s) => s._id.toString());
            if (!managedStoreIds.includes(req.params.storeId)) {
                return res.status(403).json(
                    baseDTO({
                        success: false,
                        message: "You can only view inventory for your managed stores",
                    })
                );
            }
        }

        const { page = 1, limit = 20 } = req.query;

        const result = await inventoryService.getInventoryByStore(req.params.storeId, {
            page: Number(page),
            limit: Number(limit),
        });

        // Format response với thông tin product
        const data = result.inventories.map((inv) => ({
            id: inv._id,
            store_id: inv.store_id,
            sku: inv.sku_id
                ? {
                    id: inv.sku_id._id,
                    size: inv.sku_id.size,
                    color: inv.sku_id.color,
                    sku_code: inv.sku_id.sku_code,
                    product: inv.sku_id.product_id
                        ? {
                            id: inv.sku_id.product_id._id,
                            name: inv.sku_id.product_id.name,
                            brand: inv.sku_id.product_id.brand,
                            price: inv.sku_id.product_id.price,
                        }
                        : null,
                }
                : null,
            quantity: inv.quantity,
            updatedAt: inv.updatedAt,
        }));

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Inventory retrieved successfully",
                data,
                meta: result.pagination,
            })
        );
    } catch (error) {
        console.error("GET INVENTORY ERROR:", error);
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
 * GET /api/v1/inventory/sku/:skuId
 * Lấy tồn kho theo SKU tại tất cả stores (chỉ Admin)
 */
async function getInventoryBySKU(req, res) {
    try {
        const inventories = await inventoryService.getInventoryBySKU(req.params.skuId);

        const data = inventories.map((inv) => ({
            id: inv._id,
            store: inv.store_id
                ? {
                    id: inv.store_id._id,
                    name: inv.store_id.name,
                    address: inv.store_id.address,
                    status: inv.store_id.status,
                }
                : null,
            quantity: inv.quantity,
        }));

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Inventory by SKU retrieved successfully",
                data,
            })
        );
    } catch (error) {
        console.error("GET INVENTORY BY SKU ERROR:", error);
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
 * PUT /api/v1/inventory/store/:storeId/sku/:skuId
 * Cập nhật tồn kho trực tiếp (CHỈ Admin)
 * Store Manager KHÔNG được sửa quantity trực tiếp
 */
async function updateInventory(req, res) {
    try {
        const { isValid, errors, data } = updateInventoryDTO(req.body);

        if (!isValid) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Validation failed",
                    error: errors,
                })
            );
        }

        const inventory = await inventoryService.updateInventory(
            req.params.storeId,
            req.params.skuId,
            data.quantity,
            data.note,
            req.user._id // userId để ghi changed_by
        );

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Inventory updated successfully",
                data: inventoryResponseDTO(inventory),
            })
        );
    } catch (error) {
        console.error("UPDATE INVENTORY ERROR:", error);

        if (error.message.includes("not found")) {
            return res.status(404).json(
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
 * POST /api/v1/inventory/assign
 * Assign SKU vào Store (chỉ Admin)
 */
async function assignSKUToStore(req, res) {
    try {
        const { store_id, sku_id } = req.body;
        const errors = [];

        if (!store_id) errors.push("store_id is required");
        if (!sku_id) errors.push("sku_id is required");

        if (errors.length > 0) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Validation failed",
                    error: errors,
                })
            );
        }

        const inventory = await inventoryService.assignSKUToStore(store_id, sku_id);

        return res.status(201).json(
            baseDTO({
                success: true,
                message: "SKU assigned to store successfully",
                data: inventoryResponseDTO(inventory),
            })
        );
    } catch (error) {
        console.error("ASSIGN SKU ERROR:", error);

        if (error.message.includes("not found")) {
            return res.status(404).json(
                baseDTO({
                    success: false,
                    message: error.message,
                })
            );
        }

        if (error.message.includes("already assigned")) {
            return res.status(409).json(
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
 * GET /api/v1/inventory/history
 * Lấy lịch sử thay đổi tồn kho (Admin/Store Manager)
 * Store Manager chỉ xem history của store mình quản lý
 */
async function getInventoryHistory(req, res) {
    try {
        let { store_id, sku_id, page = 1, limit = 20 } = req.query;

        // Store Manager chỉ xem history của store mình
        if (req.user.role === "store_manager") {
            const managedStores = await Store.find({ manager_id: req.user._id }).select("_id");
            const managedStoreIds = managedStores.map((s) => s._id.toString());

            if (store_id && !managedStoreIds.includes(store_id)) {
                return res.status(403).json(
                    baseDTO({
                        success: false,
                        message: "You can only view history for your managed stores",
                    })
                );
            }

            // Nếu không truyền store_id thì auto filter store đầu tiên
            if (!store_id && managedStoreIds.length === 1) {
                store_id = managedStoreIds[0];
            }
        }

        const result = await inventoryService.getInventoryHistory(store_id, sku_id, {
            page: Number(page),
            limit: Number(limit),
        });

        // Format response
        const data = result.histories.map((h) => ({
            id: h._id,
            store: h.store_id ? { id: h.store_id._id, name: h.store_id.name } : null,
            sku: h.sku_id
                ? {
                    id: h.sku_id._id,
                    size: h.sku_id.size,
                    color: h.sku_id.color,
                    sku_code: h.sku_id.sku_code,
                    product: h.sku_id.product_id
                        ? { name: h.sku_id.product_id.name, brand: h.sku_id.product_id.brand }
                        : null,
                }
                : null,
            type: h.type,
            quantity_change: h.quantity_change,
            quantity_before: h.quantity_before,
            quantity_after: h.quantity_after,
            note: h.note,
            changed_by: h.changed_by
                ? { id: h.changed_by._id, name: h.changed_by.name, email: h.changed_by.email }
                : null,
            ticket_id: h.ticket_id || null,
            createdAt: h.createdAt,
        }));

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Inventory history retrieved successfully",
                data,
                meta: result.pagination,
            })
        );
    } catch (error) {
        console.error("GET INVENTORY HISTORY ERROR:", error);
        return res.status(500).json(
            baseDTO({
                success: false,
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

module.exports = {
    getInventoryByStore,
    getInventoryBySKU,
    updateInventory,
    assignSKUToStore,
    getInventoryHistory,
};
