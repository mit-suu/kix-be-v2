const express = require("express");
const { authenticate, authorize } = require("../middlewares/auth");
const {
    getInventoryByStore,
    getInventoryBySKU,
    updateInventory,
    assignSKUToStore,
    getInventoryHistory,
} = require("../controllers/inventory.controller");

const router = express.Router();

// Tất cả routes đều cần authenticate
router.use(authenticate);

// GET    /api/v1/inventory/history                    - Lịch sử thay đổi tồn kho (Admin + Store Manager)
router.get("/history", authorize("admin", "store_manager"), getInventoryHistory);

// GET    /api/v1/inventory/store/:storeId             - Tồn kho theo store (Admin + Store Manager)
router.get("/store/:storeId", authorize("admin", "store_manager"), getInventoryByStore);

// GET    /api/v1/inventory/sku/:skuId                 - Tồn kho theo SKU (chỉ Admin)
router.get("/sku/:skuId", authorize("admin"), getInventoryBySKU);

// POST   /api/v1/inventory/assign                     - Assign SKU vào Store (chỉ Admin)
router.post("/assign", authorize("admin"), assignSKUToStore);

// PUT    /api/v1/inventory/store/:storeId/sku/:skuId  - Cập nhật tồn kho trực tiếp (chỉ Admin)
router.put("/store/:storeId/sku/:skuId", authorize("admin"), updateInventory);

module.exports = router;
