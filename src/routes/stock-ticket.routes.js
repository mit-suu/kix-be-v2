const express = require("express");
const { authenticate, authorize } = require("../middlewares/auth");
const {
    createImportTicket,
    createTransferTicket,
    confirmTicket,
    cancelTicket,
    getTickets,
    getTicketDetail,
} = require("../controllers/stock-ticket.controller");

const router = express.Router();

// Tất cả routes đều cần authenticate + admin/store_manager
router.use(authenticate);
router.use(authorize("admin", "store_manager"));

// GET    /api/v1/stock-tickets              - Lấy danh sách phiếu
router.get("/", getTickets);

// GET    /api/v1/stock-tickets/:id          - Chi tiết phiếu
router.get("/:id", getTicketDetail);

// POST   /api/v1/stock-tickets/import       - Tạo phiếu nhập hàng
router.post("/import", createImportTicket);

// POST   /api/v1/stock-tickets/transfer     - Tạo phiếu chuyển kho
router.post("/transfer", createTransferTicket);

// PUT    /api/v1/stock-tickets/:id/confirm  - Confirm phiếu
router.put("/:id/confirm", confirmTicket);

// PUT    /api/v1/stock-tickets/:id/cancel   - Hủy phiếu (chỉ Admin, check trong controller)
router.put("/:id/cancel", authenticate, authorize("admin"), cancelTicket);

module.exports = router;
