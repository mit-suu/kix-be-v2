const colorService = require("../services/color.service");

/**
 * GET /api/v1/colors - Lấy tất cả colors (public)
 */
async function getColors(req, res) {
    try {
        const colors = await colorService.getAll();
        res.json({
            status: "success",
            data: colors,
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
}

/**
 * POST /api/v1/colors - Tạo color mới (Admin only)
 */
async function createColor(req, res) {
    try {
        const { name, code, slug } = req.body;
        if (!name || !code) {
            return res.status(400).json({
                status: "error",
                message: "Name và code (hex) là bắt buộc",
            });
        }
        const color = await colorService.create({ name, code, slug });
        res.status(201).json({
            status: "success",
            data: color,
        });
    } catch (err) {
        const status = err.message.includes("already exists") ? 409 : 500;
        res.status(status).json({ status: "error", message: err.message });
    }
}

/**
 * PUT /api/v1/colors/:id - Cập nhật color (Admin only)
 */
async function updateColor(req, res) {
    try {
        const { name, code, slug } = req.body;
        const color = await colorService.update(req.params.id, { name, code, slug });
        res.json({
            status: "success",
            data: color,
        });
    } catch (err) {
        const status = err.message.includes("not found") ? 404 : err.message.includes("already exists") ? 409 : 500;
        res.status(status).json({ status: "error", message: err.message });
    }
}

/**
 * DELETE /api/v1/colors/:id - Xóa color (Admin only)
 */
async function deleteColor(req, res) {
    try {
        await colorService.remove(req.params.id);
        res.json({
            status: "success",
            message: "Đã xóa color",
        });
    } catch (err) {
        const status = err.message.includes("not found") ? 404 : 500;
        res.status(status).json({ status: "error", message: err.message });
    }
}

module.exports = {
    getColors,
    createColor,
    updateColor,
    deleteColor,
};
