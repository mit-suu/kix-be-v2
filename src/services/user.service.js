const User = require("../models/user.model");

/**
 * Lấy thông tin user
 */
async function getUserById(userId) {
    const user = await User.findById(userId).select("-password");
    if (!user) throw new Error("User not found");
    return user;
}

/**
 * Cập nhật profile
 */
async function updateProfile(userId, data) {
    const user = await User.findByIdAndUpdate(userId, data, {
        new: true,
    }).select("-password");

    if (!user) throw new Error("User not found");
    return user;
}

/**
 * Lấy danh sách users (Admin)
 */
async function getUsers({ page = 1, limit = 10, role, search } = {}) {
    const filter = {};
    if (role) filter.role = role;
    if (search) {
        filter.$or = [
            { email: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
        ];
    }

    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
        User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter),
    ]);

    return {
        users,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        },
    };
}

/**
 * Cập nhật role user (Admin)
 */
async function updateUserRole(userId, role) {
    const validRoles = ["admin", "store_manager", "customer"];
    if (!validRoles.includes(role)) {
        throw new Error("Invalid role");
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
    ).select("-password");

    if (!user) throw new Error("User not found");
    return user;
}

module.exports = {
    getUserById,
    updateProfile,
    getUsers,
    updateUserRole,
};
