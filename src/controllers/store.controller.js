const baseDTO = require("../dtos/base.dto");
const {
    storeResponseDTO,
    storeListResponseDTO,
    createStoreDTO,
    updateStoreDTO,
} = require("../dtos/store.dto");
const storeService = require("../services/store.service");

/**
 * GET /api/v1/stores
 * Lấy danh sách stores (Public)
 */
async function getStores(req, res) {
    try {
        const { page = 1, limit = 10, status, search, manager_id } = req.query;

        // Determine filters based on role
        let filterManagerId = manager_id;
        let filterStatus = "active"; // default for public/customer

        if (req.user?.role === "admin") {
            filterStatus = status; // admin can filter by any status
        } else if (req.user?.role === "store_manager") {
            // Store managers only see their own stores
            filterManagerId = req.user._id;
            filterStatus = undefined; // show both active/inactive for their stores
        }

        const result = await storeService.getStores({
            page: Number(page),
            limit: Number(limit),
            status: filterStatus,
            search,
            manager_id: filterManagerId,
        });

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Stores retrieved successfully",
                data: storeListResponseDTO(result.stores),
                meta: result.pagination,
            })
        );
    } catch (error) {
        console.error("GET STORES ERROR:", error);
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
 * GET /api/v1/stores/:id
 * Lấy chi tiết store (Public)
 */
async function getStoreDetail(req, res) {
    try {
        const store = await storeService.getStoreById(req.params.id);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Store retrieved successfully",
                data: storeResponseDTO(store),
            })
        );
    } catch (error) {
        console.error("GET STORE DETAIL ERROR:", error);

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
 * POST /api/v1/stores
 * Tạo store mới (Admin)
 */
async function createStore(req, res) {
    try {
        const body = { ...req.body };

        // File upload từ Cloudinary (multipart/form-data)
        if (req.file) body.image = req.file.path;

        // Parse features: FormData gửi dưới dạng JSON string
        if (typeof body.features === 'string') {
            try { body.features = JSON.parse(body.features); }
            catch { body.features = body.features ? [body.features] : []; }
        }

        // Parse featured boolean từ string
        if (typeof body.featured === 'string') body.featured = body.featured === 'true';

        // Parse lat/lng from string (FormData sends as string)
        if (typeof body.lat === 'string') body.lat = body.lat ? parseFloat(body.lat) : null;
        if (typeof body.lng === 'string') body.lng = body.lng ? parseFloat(body.lng) : null;

        const { isValid, errors, data } = createStoreDTO(body);

        if (!isValid) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Validation failed",
                    error: errors,
                })
            );
        }

        const store = await storeService.createStore(data);

        return res.status(201).json(
            baseDTO({
                success: true,
                message: "Store created successfully",
                data: storeResponseDTO(store),
            })
        );
    } catch (error) {
        console.error("CREATE STORE ERROR:", error);
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
 * PUT /api/v1/stores/:id
 * Cập nhật store (Admin)
 */
async function updateStore(req, res) {
    try {
        const body = { ...req.body };

        // File upload từ Cloudinary (multipart/form-data)
        if (req.file) body.image = req.file.path;

        // Parse features: FormData gửi dưới dạng JSON string
        if (typeof body.features === 'string') {
            try { body.features = JSON.parse(body.features); }
            catch { body.features = body.features ? [body.features] : []; }
        }

        // Parse featured boolean từ string
        if (typeof body.featured === 'string') body.featured = body.featured === 'true';

        // Parse lat/lng from string (FormData sends as string)
        if (typeof body.lat === 'string') body.lat = body.lat ? parseFloat(body.lat) : null;
        if (typeof body.lng === 'string') body.lng = body.lng ? parseFloat(body.lng) : null;

        const data = updateStoreDTO(body);
        const store = await storeService.updateStore(req.params.id, data);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Store updated successfully",
                data: storeResponseDTO(store),
            })
        );
    } catch (error) {
        console.error("UPDATE STORE ERROR:", error);

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
 * DELETE /api/v1/stores/:id
 * Xóa store (Admin)
 */
async function deleteStore(req, res) {
    try {
        await storeService.deleteStore(req.params.id);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Store deleted successfully",
            })
        );
    } catch (error) {
        console.error("DELETE STORE ERROR:", error);

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

module.exports = {
    getStores,
    getStoreDetail,
    createStore,
    updateStore,
    deleteStore,
};
