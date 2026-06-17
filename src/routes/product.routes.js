const express = require("express");
const { authenticate, authorize } = require("../middlewares/auth");
const { uploadProductImages } = require("../config/cloudinary");
const {
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
} = require("../controllers/product.controller");

const router = express.Router();

// ===== Public routes =====
// GET    /api/v1/products           - Lấy danh sách sản phẩm
router.get("/", getProducts);

// GET    /api/v1/products/brands    - Lấy danh sách brands
router.get("/brands", getBrands);

// GET    /api/v1/products/sizes     - Lấy danh sách sizes
router.get("/sizes", getSizes);

// GET    /api/v1/products/price-range - Lấy khoảng giá min/max
router.get("/price-range", getPriceRange);

// GET    /api/v1/products/admin     - Lấy danh sách sản phẩm cho Admin (bao gồm cả inactive)
router.get("/admin", authenticate, authorize("admin"), getProductsAdmin);

// GET    /api/v1/products/:id       - Lấy chi tiết sản phẩm
router.get("/:id", getProductDetail);

// GET    /api/v1/products/:id/skus  - Lấy SKUs của sản phẩm
router.get("/:id/skus", getProductSKUs);

// GET    /api/v1/products/:id/reviews - Lấy danh sách đánh giá
router.get("/:id/reviews", getReviews);

// POST   /api/v1/products/:id/reviews - Thêm đánh giá
router.post("/:id/reviews", authenticate, addReview);

// PUT    /api/v1/products/:id/reviews/:reviewId - Sửa đánh giá
router.put("/:id/reviews/:reviewId", authenticate, updateReview);

// DELETE /api/v1/products/:id/reviews/:reviewId - Xóa đánh giá
router.delete("/:id/reviews/:reviewId", authenticate, deleteReview);

// ===== Admin routes =====
// POST   /api/v1/products           - Tạo sản phẩm mới (upload ảnh qua Cloudinary)
router.post("/", authenticate, authorize("admin"), uploadProductImages, createProduct);

// PUT    /api/v1/products/:id       - Cập nhật sản phẩm (upload ảnh qua Cloudinary)
router.put("/:id", authenticate, authorize("admin"), uploadProductImages, updateProduct);

// DELETE /api/v1/products/:id       - Xóa sản phẩm (soft delete)
router.delete("/:id", authenticate, authorize("admin"), deleteProduct);

// POST   /api/v1/products/:id/skus  - Tạo SKU cho sản phẩm
router.post("/:id/skus", authenticate, authorize("admin"), createSKU);

module.exports = router;
