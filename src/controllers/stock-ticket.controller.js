const baseDTO = require("../dtos/base.dto");
const {
    stockTicketResponseDTO,
    stockTicketListResponseDTO,
    createImportTicketDTO,
    createTransferTicketDTO,
} = require("../dtos/stock-ticket.dto");
const stockTicketService = require("../services/stock-ticket.service");
const Store = require("../models/store.model");

/**
 * POST /api/v1/stock-tickets/import
 * Tạo Phiếu Nhập Hàng (Admin + Store Manager)
 * Store Manager chỉ tạo được phiếu cho store mình quản lý
 */
async function createImportTicket(req, res) {
    try {
        const { isValid, errors, data } = createImportTicketDTO(req.body);

        if (!isValid) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Validation failed",
                    error: errors,
                })
            );
        }

        // Store Manager chỉ tạo phiếu cho store mình quản lý
        if (req.user.role === "store_manager") {
            const managedStores = await Store.find({ manager_id: req.user._id }).select("_id");
            const managedStoreIds = managedStores.map((s) => s._id.toString());
            if (!managedStoreIds.includes(data.to_store)) {
                return res.status(403).json(
                    baseDTO({
                        success: false,
                        message: "You can only create import tickets for your managed stores",
                    })
                );
            }
        }

        const ticket = await stockTicketService.createImportTicket(
            data,
            req.user._id
        );

        return res.status(201).json(
            baseDTO({
                success: true,
                message: "Import ticket created successfully",
                data: stockTicketResponseDTO(ticket),
            })
        );
    } catch (error) {
        console.error("CREATE IMPORT TICKET ERROR:", error);

        if (error.message.includes("not found") || error.message.includes("not assigned")) {
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
                error:
                    process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

/**
 * POST /api/v1/stock-tickets/transfer
 * Tạo Phiếu Chuyển Kho (Admin + Store Manager)
 * Store Manager chỉ tạo phiếu chuyển từ store mình quản lý
 */
async function createTransferTicket(req, res) {
    try {
        const { isValid, errors, data } = createTransferTicketDTO(req.body);

        if (!isValid) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Validation failed",
                    error: errors,
                })
            );
        }

        // Store Manager chỉ tạo phiếu chuyển từ store mình quản lý
        if (req.user.role === "store_manager") {
            const managedStores = await Store.find({ manager_id: req.user._id }).select("_id");
            const managedStoreIds = managedStores.map((s) => s._id.toString());
            if (!managedStoreIds.includes(data.from_store)) {
                return res.status(403).json(
                    baseDTO({
                        success: false,
                        message:
                            "You can only create transfer tickets from your managed stores",
                    })
                );
            }
        }

        const ticket = await stockTicketService.createTransferTicket(
            data,
            req.user._id
        );

        return res.status(201).json(
            baseDTO({
                success: true,
                message: "Transfer ticket created successfully",
                data: stockTicketResponseDTO(ticket),
            })
        );
    } catch (error) {
        console.error("CREATE TRANSFER TICKET ERROR:", error);

        if (
            error.message.includes("not found") ||
            error.message.includes("Insufficient")
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
                error:
                    process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

/**
 * PUT /api/v1/stock-tickets/:id/confirm
 * Confirm Phiếu (Admin + Store Manager)
 * Store Manager chỉ confirm phiếu liên quan đến store mình quản lý
 */
async function confirmTicket(req, res) {
    try {
        // Kiểm tra quyền Store Manager
        if (req.user.role === "store_manager") {
            const stockTicketService2 = require("../services/stock-ticket.service");
            const ticket = await stockTicketService2.getTicketById(req.params.id);
            const managedStores = await Store.find({ manager_id: req.user._id }).select("_id");
            const managedStoreIds = managedStores.map((s) => s._id.toString());

            // Store Manager chỉ confirm phiếu nhận hàng vào store mình
            const toStoreId = ticket.to_store?._id?.toString() || ticket.to_store?.toString();
            if (!managedStoreIds.includes(toStoreId)) {
                return res.status(403).json(
                    baseDTO({
                        success: false,
                        message:
                            "You can only confirm tickets for your managed stores",
                    })
                );
            }
        }

        const ticket = await stockTicketService.confirmTicket(
            req.params.id,
            req.user._id
        );

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Ticket confirmed successfully",
                data: stockTicketResponseDTO(ticket),
            })
        );
    } catch (error) {
        console.error("CONFIRM TICKET ERROR:", error);

        if (
            error.message.includes("not found") ||
            error.message.includes("already") ||
            error.message.includes("Insufficient")
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
                error:
                    process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

/**
 * PUT /api/v1/stock-tickets/:id/cancel
 * Hủy Phiếu (chỉ Admin)
 */
async function cancelTicket(req, res) {
    try {
        const ticket = await stockTicketService.cancelTicket(
            req.params.id,
            req.user._id
        );

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Ticket cancelled successfully",
                data: stockTicketResponseDTO(ticket),
            })
        );
    } catch (error) {
        console.error("CANCEL TICKET ERROR:", error);

        if (
            error.message.includes("not found") ||
            error.message.includes("already")
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
                error:
                    process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

/**
 * GET /api/v1/stock-tickets
 * Lấy danh sách phiếu
 * Admin thấy tất cả, Store Manager chỉ thấy phiếu của store mình
 */
async function getTickets(req, res) {
    try {
        const { type, status, store_id, page = 1, limit = 20 } = req.query;

        let filterStoreId = store_id;

        // Store Manager chỉ xem phiếu liên quan store mình
        if (req.user.role === "store_manager") {
            const managedStores = await Store.find({ manager_id: req.user._id }).select("_id");
            const managedStoreIds = managedStores.map((s) => s._id.toString());
            if (store_id) {
                // Kiểm tra store_id có thuộc managed stores
                if (!managedStoreIds.includes(store_id)) {
                    return res.status(403).json(
                        baseDTO({
                            success: false,
                            message: "You can only view tickets for your managed stores",
                        })
                    );
                }
            } else if (managedStoreIds.length === 1) {
                // Nếu chỉ quản lý 1 store thì auto filter
                filterStoreId = managedStoreIds[0];
            }
        }

        const result = await stockTicketService.getTickets({
            type,
            status,
            store_id: filterStoreId,
            page: Number(page),
            limit: Number(limit),
        });

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Tickets retrieved successfully",
                data: stockTicketListResponseDTO(result.tickets),
                meta: result.pagination,
            })
        );
    } catch (error) {
        console.error("GET TICKETS ERROR:", error);
        return res.status(500).json(
            baseDTO({
                success: false,
                message: "Server error",
                error:
                    process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

/**
 * GET /api/v1/stock-tickets/:id
 * Lấy chi tiết phiếu
 */
async function getTicketDetail(req, res) {
    try {
        const ticket = await stockTicketService.getTicketById(req.params.id);

        // Store Manager chỉ xem phiếu liên quan store mình
        if (req.user.role === "store_manager") {
            const managedStores = await Store.find({ manager_id: req.user._id }).select("_id");
            const managedStoreIds = managedStores.map((s) => s._id.toString());
            const toStoreId = ticket.to_store?._id?.toString() || ticket.to_store?.toString();
            const fromStoreId = ticket.from_store?._id?.toString() || ticket.from_store?.toString();

            if (
                !managedStoreIds.includes(toStoreId) &&
                (!fromStoreId || !managedStoreIds.includes(fromStoreId))
            ) {
                return res.status(403).json(
                    baseDTO({
                        success: false,
                        message: "You do not have access to this ticket",
                    })
                );
            }
        }

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Ticket retrieved successfully",
                data: stockTicketResponseDTO(ticket),
            })
        );
    } catch (error) {
        console.error("GET TICKET DETAIL ERROR:", error);

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
                error:
                    process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

module.exports = {
    createImportTicket,
    createTransferTicket,
    confirmTicket,
    cancelTicket,
    getTickets,
    getTicketDetail,
};
