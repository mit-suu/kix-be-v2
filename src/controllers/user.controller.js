const baseDTO = require("../dtos/base.dto");
const { userResponseDTO, updateUserDTO } = require("../dtos/user.dto");
const userService = require("../services/user.service");

/**
 * GET /api/v1/users/profile
 * Lấy thông tin profile của user hiện tại
 */
async function getProfile(req, res) {
    try {
        const user = await userService.getUserById(req.user.userId);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Profile retrieved successfully",
                data: userResponseDTO(user),
            })
        );
    } catch (error) {
        console.error("GET PROFILE ERROR:", error);

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
 * PUT /api/v1/users/profile
 * Cập nhật profile
 */
async function updateProfile(req, res) {
    try {
        const data = updateUserDTO(req.body);

        // Xử lý avatar upload qua multer/cloudinary
        if (req.file) {
            data.avatar = req.file.path;
        }

        const user = await userService.updateProfile(req.user.userId, data);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Profile updated successfully",
                data: userResponseDTO(user),
            })
        );
    } catch (error) {
        console.error("UPDATE PROFILE ERROR:", error);

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
 * GET /api/v1/users (Admin)
 * Lấy danh sách users
 */
async function getUsers(req, res) {
    try {
        const { page = 1, limit = 10, role, search } = req.query;

        const result = await userService.getUsers({
            page: Number(page),
            limit: Number(limit),
            role,
            search,
        });

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Users retrieved successfully",
                data: result.users.map(userResponseDTO),
                meta: result.pagination,
            })
        );
    } catch (error) {
        console.error("GET USERS ERROR:", error);
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
 * PUT /api/v1/users/:id/role (Admin)
 * Cập nhật role user
 */
async function updateUserRole(req, res) {
    try {
        const { role } = req.body;

        if (!role) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Role is required",
                })
            );
        }

        const user = await userService.updateUserRole(req.params.id, role);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "User role updated successfully",
                data: userResponseDTO(user),
            })
        );
    } catch (error) {
        console.error("UPDATE USER ROLE ERROR:", error);

        if (error.message.includes("not found") || error.message.includes("Invalid role")) {
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
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

module.exports = {
    getProfile,
    updateProfile,
    getUsers,
    updateUserRole,
};
