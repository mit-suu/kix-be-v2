const baseDTO = require("../dtos/base.dto");
const {
    productResponseDTO,
    productListResponseDTO,
    productDetailResponseDTO,
    createProductDTO,
    updateProductDTO,
} = require("../dtos/product.dto");
const productService = require("../services/product.service");

/**
 * GET /api/v1/products
 * Lấy danh sách sản phẩm (Public)
 */
async function getProducts(req, res) {
    try {
        const { page = 1, limit = 12, brand, search, status, sort, color, size, minPrice, maxPrice } = req.query;

        const result = await productService.getProducts({
            page: Number(page),
            limit: Number(limit),
            brand,
            search,
            status: req.user?.role === "admin" ? status : "active",
            sort,
            color,
            size: size ? Number(size) : undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
        });

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Products retrieved successfully",
                data: productListResponseDTO(result.products),
                meta: result.pagination,
            })
        );
    } catch (error) {
        console.error("GET PRODUCTS ERROR:", error);
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
 * GET /api/v1/products/admin
 * Lấy danh sách sản phẩm cho Admin (bao gồm cả inactive)
 */
async function getProductsAdmin(req, res) {
    try {
        const { page = 1, limit = 12, brand, search, status, sort, color, size, minPrice, maxPrice } = req.query;

        const result = await productService.getProducts({
            page: Number(page),
            limit: Number(limit),
            brand,
            search,
            status,
            sort,
            color,
            size: size ? Number(size) : undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
        });

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Products retrieved successfully",
                data: productListResponseDTO(result.products),
                meta: result.pagination,
            })
        );
    } catch (error) {
        console.error("GET PRODUCTS ADMIN ERROR:", error);
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
 * GET /api/v1/products/brands
 * Lấy danh sách brands (Public)
 */
async function getBrands(req, res) {
    try {
        const brands = await productService.getAllBrands();

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Brands retrieved successfully",
                data: brands,
            })
        );
    } catch (error) {
        console.error("GET BRANDS ERROR:", error);
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
 * GET /api/v1/products/:id
 * Lấy chi tiết sản phẩm + SKUs + availability (Public)
 */
async function getProductDetail(req, res) {
    try {
        const result = await productService.getProductDetail(req.params.id);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Product detail retrieved successfully",
                data: productDetailResponseDTO(result.product, result.skus, result.availability),
            })
        );
    } catch (error) {
        console.error("GET PRODUCT DETAIL ERROR:", error);

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
 * POST /api/v1/products
 * Tạo sản phẩm mới (Admin)
 */
async function createProduct(req, res) {
    try {
        const { isValid, errors, data } = createProductDTO(req.body);

        if (!isValid) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Validation failed",
                    error: errors,
                })
            );
        }

        // Xử lý ảnh upload qua multer/cloudinary
        if (req.files && req.files.length > 0) {
            data.images = req.files.map((file, index) => ({
                url: file.path,
                is_primary: index === 0,
            }));
        }

        const product = await productService.createProduct(data);

        return res.status(201).json(
            baseDTO({
                success: true,
                message: "Product created successfully",
                data: productResponseDTO(product),
            })
        );
    } catch (error) {
        console.error("CREATE PRODUCT ERROR:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Validation failed",
                    error: Object.values(error.errors).map((err) => err.message),
                })
            );
        }

        if (error.code === 11000) {
            return res.status(409).json(
                baseDTO({
                    success: false,
                    message: "Product already exists",
                    error: error.keyValue,
                })
            );
        }

        return res.status(500).json(
            baseDTO({
                success: false,
                message: "Server error",
                error: error.message,
            })
        );
    }
}

/**
 * PUT /api/v1/products/:id
 * Cập nhật sản phẩm (Admin)
 */
async function updateProduct(req, res) {
    try {
        const data = updateProductDTO(req.body);

        // Xử lý ảnh upload qua multer/cloudinary
        if (req.files && req.files.length > 0) {
            data.images = req.files.map((file, index) => ({
                url: file.path,
                is_primary: index === 0,
            }));
        }

        const product = await productService.updateProduct(req.params.id, data);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Product updated successfully",
                data: productResponseDTO(product),
            })
        );
    } catch (error) {
        console.error("UPDATE PRODUCT ERROR:", error);

        if (error.message.includes("not found")) {
            return res.status(404).json(
                baseDTO({
                    success: false,
                    message: error.message,
                })
            );
        }

        if (error.name === "ValidationError") {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Validation failed",
                    error: Object.values(error.errors).map((err) => err.message),
                })
            );
        }

        return res.status(500).json(
            baseDTO({
                success: false,
                message: "Server error",
                error: error.message,
            })
        );
    }
}

/**
 * DELETE /api/v1/products/:id
 * Xóa sản phẩm - soft delete (Admin)
 */
async function deleteProduct(req, res) {
    try {
        await productService.deleteProduct(req.params.id);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Product deleted successfully",
            })
        );
    } catch (error) {
        console.error("DELETE PRODUCT ERROR:", error);

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
 * POST /api/v1/products/:id/skus
 * Tạo SKU cho sản phẩm (Admin)
 */
async function createSKU(req, res) {
    try {
        const { size, color, sku_code } = req.body;
        const errors = [];

        if (!size) errors.push("Size is required");
        if (!color) errors.push("Color is required");
        if (!sku_code) errors.push("SKU code is required");

        if (errors.length > 0) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Validation failed",
                    error: errors,
                })
            );
        }

        const sku = await productService.createSKU({
            product_id: req.params.id,
            size: Number(size),
            color: color.trim(),
            sku_code: sku_code.trim(),
        });

        return res.status(201).json(
            baseDTO({
                success: true,
                message: "SKU created successfully",
                data: {
                    id: sku._id,
                    product_id: sku.product_id,
                    size: sku.size,
                    color: sku.color,
                    sku_code: sku.sku_code,
                },
            })
        );
    } catch (error) {
        console.error("CREATE SKU ERROR:", error);

        if (error.message.includes("not found")) {
            return res.status(404).json(
                baseDTO({
                    success: false,
                    message: error.message,
                })
            );
        }

        if (error.code === 11000) {
            return res.status(409).json(
                baseDTO({
                    success: false,
                    message: "SKU code already exists",
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
 * GET /api/v1/products/:id/skus
 * Lấy danh sách SKU của sản phẩm (Public)
 */
async function getProductSKUs(req, res) {
    try {
        const skus = await productService.getSKUsByProduct(req.params.id);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "SKUs retrieved successfully",
                data: skus.map((sku) => ({
                    id: sku._id,
                    product_id: sku.product_id,
                    size: sku.size,
                    color: sku.color,
                    sku_code: sku.sku_code,
                })),
            })
        );
    } catch (error) {
        console.error("GET PRODUCT SKUS ERROR:", error);
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
 * GET /api/v1/products/sizes
 * Lấy danh sách sizes (Public)
 */
async function getSizes(req, res) {
    try {
        const sizes = await productService.getAllSizes();

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Sizes retrieved successfully",
                data: sizes,
            })
        );
    } catch (error) {
        console.error("GET SIZES ERROR:", error);
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
 * GET /api/v1/products/price-range
 * Lấy khoảng giá min/max (Public)
 */
async function getPriceRange(req, res) {
    try {
        const range = await productService.getPriceRange();

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Price range retrieved successfully",
                data: range,
            })
        );
    } catch (error) {
        console.error("GET PRICE RANGE ERROR:", error);
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
 * GET /api/v1/products/:id/reviews
 * Lấy danh sách đánh giá của sản phẩm (Public)
 */
async function getReviews(req, res) {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await productService.getReviews(req.params.id, {
            page: Number(page),
            limit: Number(limit)
        });

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Reviews retrieved successfully",
                data: result.reviews,
                meta: result.pagination,
            })
        );
    } catch (error) {
        console.error("GET REVIEWS ERROR:", error);
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
 * POST /api/v1/products/:id/reviews
 * Thêm đánh giá cho sản phẩm (Auth)
 */
async function addReview(req, res) {
    try {
        const { rating, comment } = req.body;
        if (!rating || !comment) {
            return res.status(400).json(
                baseDTO({
                    success: false,
                    message: "Vui lòng cung cấp rating và comment",
                })
            );
        }

        const review = await productService.addReview(req.params.id, req.user.id, { rating, comment });

        return res.status(201).json(
            baseDTO({
                success: true,
                message: "Review added successfully",
                data: review,
            })
        );
    } catch (error) {
        console.error("ADD REVIEW ERROR:", error);
        
        if (error.message.includes("đã mua") || error.message.includes("đã đánh giá")) {
             return res.status(403).json(
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
 * PUT /api/v1/products/:id/reviews/:reviewId
 * Sửa đánh giá (Auth)
 */
async function updateReview(req, res) {
    try {
        const { rating, comment } = req.body;
        const review = await productService.updateReview(req.params.reviewId, req.user.id, { rating, comment });

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Review updated successfully",
                data: review,
            })
        );
    } catch (error) {
        console.error("UPDATE REVIEW ERROR:", error);
        
        const status = error.message.includes("Không tìm thấy") ? 404 : 403;
        
        return res.status(status).json(
            baseDTO({
                success: false,
                message: error.message,
            })
        );
    }
}

/**
 * DELETE /api/v1/products/:id/reviews/:reviewId
 * Xóa đánh giá (Auth)
 */
async function deleteReview(req, res) {
    try {
        await productService.deleteReview(req.params.reviewId, req.user.id);

        return res.status(200).json(
            baseDTO({
                success: true,
                message: "Review deleted successfully",
            })
        );
    } catch (error) {
        console.error("DELETE REVIEW ERROR:", error);
        
        const status = error.message.includes("Không tìm thấy") ? 404 : 403;
        
        return res.status(status).json(
            baseDTO({
                success: false,
                message: error.message,
            })
        );
    }
}

module.exports = {
    getProducts,
    getProductsAdmin,
    getBrands,
    getSizes,
    getPriceRange,
    getProductDetail,
    createProduct,
    updateProduct,
    deleteProduct,
    createSKU,
    getProductSKUs,
    getReviews,
    addReview,
    updateReview,
    deleteReview,
};
