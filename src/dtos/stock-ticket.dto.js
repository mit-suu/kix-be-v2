// Stock Ticket DTOs

// Response DTO
function stockTicketResponseDTO(ticket) {
    if (!ticket) return null;

    return {
        id: ticket._id,
        type: ticket.type,
        to_store: ticket.to_store?._id
            ? {
                id: ticket.to_store._id,
                name: ticket.to_store.name,
                address: ticket.to_store.address,
            }
            : ticket.to_store,
        from_store: ticket.from_store?._id
            ? {
                id: ticket.from_store._id,
                name: ticket.from_store.name,
                address: ticket.from_store.address,
            }
            : ticket.from_store || null,
        items: ticket.items?.map((item) => ({
            sku_id: item.sku_id?._id || item.sku_id,
            sku_code: item.sku_id?.sku_code || undefined,
            size: item.sku_id?.size || undefined,
            color: item.sku_id?.color || undefined,
            product: item.sku_id?.product_id
                ? {
                    id: item.sku_id.product_id._id,
                    name: item.sku_id.product_id.name,
                    brand: item.sku_id.product_id.brand,
                }
                : undefined,
            quantity: item.quantity,
        })),
        status: ticket.status,
        note: ticket.note,
        created_by: ticket.created_by?._id
            ? {
                id: ticket.created_by._id,
                name: ticket.created_by.name,
                email: ticket.created_by.email,
            }
            : ticket.created_by,
        confirmed_by: ticket.confirmed_by?._id
            ? {
                id: ticket.confirmed_by._id,
                name: ticket.confirmed_by.name,
                email: ticket.confirmed_by.email,
            }
            : ticket.confirmed_by || null,
        cancelled_by: ticket.cancelled_by?._id
            ? {
                id: ticket.cancelled_by._id,
                name: ticket.cancelled_by.name,
                email: ticket.cancelled_by.email,
            }
            : ticket.cancelled_by || null,
        confirmed_at: ticket.confirmed_at,
        cancelled_at: ticket.cancelled_at,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
    };
}

// Stock Ticket List Response
function stockTicketListResponseDTO(tickets) {
    return tickets.map(stockTicketResponseDTO);
}

// Create Import Ticket DTO (Phiếu Nhập Hàng)
function createImportTicketDTO(data) {
    const errors = [];

    if (!data.to_store) errors.push("to_store is required");
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        errors.push("At least one item is required");
    } else {
        data.items.forEach((item, index) => {
            if (!item.sku_id) errors.push(`items[${index}].sku_id is required`);
            if (!item.quantity || item.quantity < 1)
                errors.push(`items[${index}].quantity must be >= 1`);
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        data: {
            type: "IMPORT",
            to_store: data.to_store,
            items: data.items?.map((item) => ({
                sku_id: item.sku_id,
                quantity: Number(item.quantity),
            })),
            note: data.note?.trim() || "",
        },
    };
}

// Create Transfer Ticket DTO (Phiếu Chuyển Kho)
function createTransferTicketDTO(data) {
    const errors = [];

    if (!data.from_store) errors.push("from_store is required");
    if (!data.to_store) errors.push("to_store is required");
    if (data.from_store && data.to_store && data.from_store === data.to_store) {
        errors.push("from_store and to_store must be different");
    }
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        errors.push("At least one item is required");
    } else {
        data.items.forEach((item, index) => {
            if (!item.sku_id) errors.push(`items[${index}].sku_id is required`);
            if (!item.quantity || item.quantity < 1)
                errors.push(`items[${index}].quantity must be >= 1`);
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        data: {
            type: "TRANSFER",
            from_store: data.from_store,
            to_store: data.to_store,
            items: data.items?.map((item) => ({
                sku_id: item.sku_id,
                quantity: Number(item.quantity),
            })),
            note: data.note?.trim() || "",
        },
    };
}

module.exports = {
    stockTicketResponseDTO,
    stockTicketListResponseDTO,
    createImportTicketDTO,
    createTransferTicketDTO,
};
