// Inventory DTOs

// Response DTO
function inventoryResponseDTO(inventory) {
  if (!inventory) return null;

  return {
    id: inventory._id,
    store_id: inventory.store_id,
    sku_id: inventory.sku_id,
    quantity: inventory.quantity,
    updatedAt: inventory.updatedAt,
  };
}

// Inventory List Response
function inventoryListResponseDTO(inventories) {
  return inventories.map(inventoryResponseDTO);
}

// Update Inventory DTO (Restock/Adjust)
function updateInventoryDTO(data) {
  const errors = [];

  if (data.quantity === undefined || data.quantity < 0) {
    errors.push("Valid quantity is required (>= 0)");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      quantity: Number(data.quantity),
      note: data.note?.trim() || "",
    },
  };
}

// Inventory History Response DTO
function inventoryHistoryResponseDTO(history) {
  if (!history) return null;

  return {
    id: history._id,
    store_id: history.store_id,
    sku_id: history.sku_id,
    type: history.type,
    quantity_change: history.quantity_change,
    quantity_before: history.quantity_before,
    quantity_after: history.quantity_after,
    note: history.note,
    createdAt: history.createdAt,
  };
}

// Inventory History List Response
function inventoryHistoryListResponseDTO(histories) {
  return histories.map(inventoryHistoryResponseDTO);
}

module.exports = {
  inventoryResponseDTO,
  inventoryListResponseDTO,
  updateInventoryDTO,
  inventoryHistoryResponseDTO,
  inventoryHistoryListResponseDTO,
};
