const Store = require("../models/store.model");

/**
 * Lấy danh sách stores
 */
async function getStores({ page = 1, limit = 10, status, search, manager_id } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (manager_id) filter.manager_id = manager_id;
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } },
        ];
    }

    const skip = (page - 1) * limit;

    const [stores, totalCount] = await Promise.all([
        Store.find(filter).populate('manager_id', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
        Store.countDocuments(filter),
    ]);

    return {
        stores,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        },
    };
}

/**
 * Lấy chi tiết store
 */
async function getStoreById(storeId) {
    const store = await Store.findById(storeId).populate('manager_id', 'name email');
    if (!store) throw new Error("Store not found");
    return store;
}

/**
 * Tạo store mới (Admin)
 */
async function createStore(data) {
    return await Store.create(data);
}

/**
 * Cập nhật store (Admin)
 */
async function updateStore(storeId, data) {
    const store = await Store.findByIdAndUpdate(storeId, data, { new: true });
    if (!store) throw new Error("Store not found");
    return store;
}

/**
 * Xóa store (Admin)
 */
async function deleteStore(storeId) {
    const store = await Store.findByIdAndDelete(storeId);
    if (!store) throw new Error("Store not found");
    return store;
}

module.exports = {
    getStores,
    getStoreById,
    createStore,
    updateStore,
    deleteStore,
};
