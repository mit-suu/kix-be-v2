const baseDTO = require("../dtos/base.dto");
const { cartResponseDTO, addToCartDTO, updateCartItemDTO } = require("../dtos/cart.dto");
const cartService = require("../services/cart.service");

/**
 * GET /api/v1/cart
 * Lấy giỏ hàng của user hiện tại
 */
async function getCart(req, res) {
    try {
        const cart = await cartService.getCartByUserId(req.user.userId);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Cart retrieved successfully",
                data: cartResponseDTO(cart),
            })
        );
    } catch (error) {
        console.error("GET CART ERROR:", error);
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
 * POST /api/v1/cart/items
 * Thêm sản phẩm vào giỏ hàng
 */
async function addToCart(req, res) {
    try {
        const { isValid, errors, data } = addToCartDTO(req.body);

        if (!isValid) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Validation failed",
                    error: errors,
                })
            );
        }

        const cart = await cartService.addItemToCart(req.user.userId, data);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Item added to cart",
                data: cartResponseDTO(cart),
            })
        );
    } catch (error) {
        console.error("ADD TO CART ERROR:", error);

        if (
            error.message.includes("not found") ||
            error.message.includes("not available") ||
            error.message.includes("Insufficient") ||
            error.message.includes("Maximum")
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
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

/**
 * PUT /api/v1/cart/items/:itemId
 * Cập nhật số lượng item trong giỏ hàng
 */
async function updateCartItemCtrl(req, res) {
    try {
        const { isValid, errors, data } = updateCartItemDTO(req.body);

        if (!isValid) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Validation failed",
                    error: errors,
                })
            );
        }

        const cart = await cartService.updateCartItem(
            req.user.userId,
            req.params.itemId,
            data.quantity
        );

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Cart item updated",
                data: cartResponseDTO(cart),
            })
        );
    } catch (error) {
        console.error("UPDATE CART ITEM ERROR:", error);

        if (error.message.includes("not found") || error.message.includes("Insufficient")) {
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

/**
 * DELETE /api/v1/cart/items/:itemId
 * Xóa item khỏi giỏ hàng
 */
async function removeCartItem(req, res) {
    try {
        const cart = await cartService.removeCartItem(
            req.user.userId,
            req.params.itemId
        );

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Item removed from cart",
                data: cartResponseDTO(cart),
            })
        );
    } catch (error) {
        console.error("REMOVE CART ITEM ERROR:", error);

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
 * DELETE /api/v1/cart
 * Xóa toàn bộ giỏ hàng
 */
async function clearCart(req, res) {
    try {
        const cart = await cartService.clearCart(req.user.userId);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Cart cleared",
                data: cartResponseDTO(cart),
            })
        );
    } catch (error) {
        console.error("CLEAR CART ERROR:", error);
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
    getCart,
    addToCart,
    updateCartItem: updateCartItemCtrl,
    removeCartItem,
    clearCart,
};
