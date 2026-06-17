const StockTicket = require("../models/stock-ticket.model");
const Inventory = require("../models/inventory.model");
const InventoryHistory = require("../models/inventory-history.model");
const Store = require("../models/store.model");
const SKU = require("../models/sku.model");
const User = require("../models/user.model");

/**
 * Tạo Phiếu Nhập Hàng (IMPORT)
 * Admin hoặc Store Manager (chỉ cho store mình quản lý)
 */
async function createImportTicket(data, userId) {
    // Validate store
    const store = await Store.findById(data.to_store);
    if (!store) throw new Error("Store not found");

    // Validate tất cả SKU
    const skuIds = data.items.map((item) => item.sku_id);
    const skus = await SKU.find({ _id: { $in: skuIds } });
    if (skus.length !== skuIds.length) {
        throw new Error("One or more SKU not found");
    }

    // Validate tất cả SKU đã được assign vào store
    const inventories = await Inventory.find({
        store_id: data.to_store,
        sku_id: { $in: skuIds },
    });
    const assignedSkuIds = inventories.map((inv) => inv.sku_id.toString());
    const unassignedSkus = skuIds.filter(
        (id) => !assignedSkuIds.includes(id.toString())
    );
    if (unassignedSkus.length > 0) {
        throw new Error(
            `SKU(s) ${unassignedSkus.join(", ")} not assigned to this store`
        );
    }

    const ticket = await StockTicket.create({
        type: "IMPORT",
        to_store: data.to_store,
        items: data.items,
        note: data.note || "",
        created_by: userId,
    });

    return await StockTicket.findById(ticket._id)
        .populate("to_store", "name address")
        .populate("created_by", "name email")
        .populate({
            path: "items.sku_id",
            populate: { path: "product_id", select: "name brand" },
        });
}

/**
 * Tạo Phiếu Chuyển Kho (TRANSFER)
 * Admin hoặc Store Manager (của from_store)
 */
async function createTransferTicket(data, userId) {
    // Validate stores
    const [fromStore, toStore] = await Promise.all([
        Store.findById(data.from_store),
        Store.findById(data.to_store),
    ]);
    if (!fromStore) throw new Error("From store not found");
    if (!toStore) throw new Error("To store not found");

    // Validate SKUs
    const skuIds = data.items.map((item) => item.sku_id);
    const skus = await SKU.find({ _id: { $in: skuIds } });
    if (skus.length !== skuIds.length) {
        throw new Error("One or more SKU not found");
    }

    // Validate tồn kho bên gửi đủ
    for (const item of data.items) {
        const inv = await Inventory.findOne({
            store_id: data.from_store,
            sku_id: item.sku_id,
        });
        if (!inv) {
            throw new Error(`SKU ${item.sku_id} not found in from_store inventory`);
        }
        if (inv.quantity < item.quantity) {
            throw new Error(
                `Insufficient stock for SKU ${item.sku_id}. Available: ${inv.quantity}, Requested: ${item.quantity}`
            );
        }
    }

    const ticket = await StockTicket.create({
        type: "TRANSFER",
        from_store: data.from_store,
        to_store: data.to_store,
        items: data.items,
        note: data.note || "",
        created_by: userId,
    });

    return await StockTicket.findById(ticket._id)
        .populate("from_store", "name address")
        .populate("to_store", "name address")
        .populate("created_by", "name email")
        .populate({
            path: "items.sku_id",
            populate: { path: "product_id", select: "name brand" },
        });
}

/**
 * Confirm Phiếu (IMPORT hoặc TRANSFER)
 * - IMPORT: confirm → quantity tăng ở to_store
 * - TRANSFER: confirm (bên nhận) → quantity trừ bên gửi, cộng bên nhận
 */
async function confirmTicket(ticketId, userId) {
    const ticket = await StockTicket.findById(ticketId);
    if (!ticket) throw new Error("Ticket not found");
    if (ticket.status !== "pending") {
        throw new Error(`Ticket is already ${ticket.status}`);
    }

    // Process từng item
    for (const item of ticket.items) {
        if (ticket.type === "IMPORT") {
            // Tăng quantity ở to_store
            const inv = await Inventory.findOne({
                store_id: ticket.to_store,
                sku_id: item.sku_id,
            });

            const quantityBefore = inv ? inv.quantity : 0;
            const quantityAfter = quantityBefore + item.quantity;

            if (inv) {
                inv.quantity = quantityAfter;
                await inv.save();
            } else {
                await Inventory.create({
                    store_id: ticket.to_store,
                    sku_id: item.sku_id,
                    quantity: item.quantity,
                });
            }

            // Ghi inventory history
            await InventoryHistory.create({
                store_id: ticket.to_store,
                sku_id: item.sku_id,
                type: "IMPORT",
                quantity_change: item.quantity,
                quantity_before: quantityBefore,
                quantity_after: quantityAfter,
                note: ticket.note || `Import ticket #${ticket._id}`,
                changed_by: userId,
                ticket_id: ticket._id,
            });
        } else if (ticket.type === "TRANSFER") {
            // Trừ quantity bên gửi
            const fromInv = await Inventory.findOne({
                store_id: ticket.from_store,
                sku_id: item.sku_id,
            });

            if (!fromInv || fromInv.quantity < item.quantity) {
                throw new Error(
                    `Insufficient stock for SKU ${item.sku_id} at from_store`
                );
            }

            const fromBefore = fromInv.quantity;
            const fromAfter = fromBefore - item.quantity;
            fromInv.quantity = fromAfter;
            await fromInv.save();

            // Ghi history bên gửi
            await InventoryHistory.create({
                store_id: ticket.from_store,
                sku_id: item.sku_id,
                type: "TRANSFER_OUT",
                quantity_change: -item.quantity,
                quantity_before: fromBefore,
                quantity_after: fromAfter,
                note: ticket.note || `Transfer to store (ticket #${ticket._id})`,
                changed_by: userId,
                ticket_id: ticket._id,
            });

            // Cộng quantity bên nhận
            let toInv = await Inventory.findOne({
                store_id: ticket.to_store,
                sku_id: item.sku_id,
            });

            const toBefore = toInv ? toInv.quantity : 0;
            const toAfter = toBefore + item.quantity;

            if (toInv) {
                toInv.quantity = toAfter;
                await toInv.save();
            } else {
                await Inventory.create({
                    store_id: ticket.to_store,
                    sku_id: item.sku_id,
                    quantity: item.quantity,
                });
            }

            // Ghi history bên nhận
            await InventoryHistory.create({
                store_id: ticket.to_store,
                sku_id: item.sku_id,
                type: "TRANSFER_IN",
                quantity_change: item.quantity,
                quantity_before: toBefore,
                quantity_after: toAfter,
                note: ticket.note || `Transfer from store (ticket #${ticket._id})`,
                changed_by: userId,
                ticket_id: ticket._id,
            });
        }
    }

    // Cập nhật trạng thái phiếu
    ticket.status = "confirmed";
    ticket.confirmed_by = userId;
    ticket.confirmed_at = new Date();
    await ticket.save();

    return await StockTicket.findById(ticket._id)
        .populate("from_store", "name address")
        .populate("to_store", "name address")
        .populate("created_by", "name email")
        .populate("confirmed_by", "name email")
        .populate({
            path: "items.sku_id",
            populate: { path: "product_id", select: "name brand" },
        });
}

/**
 * Hủy Phiếu (chỉ Admin)
 */
async function cancelTicket(ticketId, userId) {
    const ticket = await StockTicket.findById(ticketId);
    if (!ticket) throw new Error("Ticket not found");
    if (ticket.status !== "pending") {
        throw new Error(`Ticket is already ${ticket.status}`);
    }

    ticket.status = "cancelled";
    ticket.cancelled_by = userId;
    ticket.cancelled_at = new Date();
    await ticket.save();

    return await StockTicket.findById(ticket._id)
        .populate("from_store", "name address")
        .populate("to_store", "name address")
        .populate("created_by", "name email")
        .populate("cancelled_by", "name email")
        .populate({
            path: "items.sku_id",
            populate: { path: "product_id", select: "name brand" },
        });
}

/**
 * Lấy danh sách phiếu (có filter)
 */
async function getTickets(
    { type, status, store_id, page = 1, limit = 20 } = {}
) {
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (store_id) {
        filter.$or = [{ to_store: store_id }, { from_store: store_id }];
    }

    const skip = (page - 1) * limit;

    const [tickets, totalCount] = await Promise.all([
        StockTicket.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("from_store", "name address")
            .populate("to_store", "name address")
            .populate("created_by", "name email")
            .populate("confirmed_by", "name email")
            .populate("cancelled_by", "name email")
            .populate({
                path: "items.sku_id",
                populate: { path: "product_id", select: "name brand" },
            }),
        StockTicket.countDocuments(filter),
    ]);

    return {
        tickets,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        },
    };
}

/**
 * Lấy chi tiết phiếu
 */
async function getTicketById(ticketId) {
    const ticket = await StockTicket.findById(ticketId)
        .populate("from_store", "name address")
        .populate("to_store", "name address")
        .populate("created_by", "name email")
        .populate("confirmed_by", "name email")
        .populate("cancelled_by", "name email")
        .populate({
            path: "items.sku_id",
            populate: { path: "product_id", select: "name brand" },
        });

    if (!ticket) throw new Error("Ticket not found");
    return ticket;
}

module.exports = {
    createImportTicket,
    createTransferTicket,
    confirmTicket,
    cancelTicket,
    getTickets,
    getTicketById,
};
