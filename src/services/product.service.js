const mongoose = require("mongoose");
const Product = require("../models/product.model");
const SKU = require("../models/sku.model");
const Inventory = require("../models/inventory.model");
const Store = require("../models/store.model");
const Color = require("../models/color.model");
const Review = require("../models/review.model");
const Order = require("../models/order.model");
/**
 * Lấy danh sách sản phẩm (có filter, search, pagination)
 */
async function getProducts({ page = 1, limit = 12, brand, search, status = "active", sort = "-createdAt", color, size, minPrice, maxPrice } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (brand) filter.brand = { $regex: brand, $options: "i" };
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { brand: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = minPrice;
        if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Filter by color and/or size via SKU lookup
    if (color || size) {
        const skuFilter = {};
        if (color) skuFilter.color = { $regex: new RegExp(`^${color.trim()}$`, 'i') };
        if (size) skuFilter.size = size;

        const matchingSkus = await SKU.find(skuFilter).select('product_id');
        const productIds = [...new Set(matchingSkus.map(s => s.product_id.toString()))];

        if (productIds.length === 0) {
            return {
                products: [],
                pagination: { page, limit, totalCount: 0, totalPages: 0 },
            };
        }

        filter._id = { $in: productIds };
    }

    const skip = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
        Product.find(filter).sort(sort).skip(skip).limit(limit),
        Product.countDocuments(filter),
    ]);

    return {
        products,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        },
    };
}

/**
 * Lấy chi tiết sản phẩm + SKUs + availability tại các store
 */
async function getProductDetail(productId) {
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    const skus = await SKU.find({ product_id: productId });

    // Lấy tồn kho từ tất cả các store
    const skuIds = skus.map((s) => s._id);
    const inventories = await Inventory.find({ sku_id: { $in: skuIds }, quantity: { $gt: 0 } })
        .populate("store_id", "name address status");

    // Group theo store
    const storeMap = {};
    for (const inv of inventories) {
        if (!inv.store_id || inv.store_id.status !== "active") continue;

        const storeIdStr = inv.store_id._id.toString();
        if (!storeMap[storeIdStr]) {
            storeMap[storeIdStr] = {
                store_id: inv.store_id._id,
                store_name: inv.store_id.name,
                store_address: inv.store_id.address,
                skus: [],
            };
        }

        const sku = skus.find((s) => s._id.toString() === inv.sku_id.toString());
        if (sku) {
            storeMap[storeIdStr].skus.push({
                sku_id: sku._id,
                size: sku.size,
                color: sku.color,
                sku_code: sku.sku_code,
                quantity: inv.quantity,
            });
        }
    }

    return {
        product,
        skus,
        availability: Object.values(storeMap),
    };
}

/**
 * Tạo sản phẩm mới (Admin)
 */
async function createProduct(data) {
    return await Product.create(data);
}

/**
 * Cập nhật sản phẩm (Admin)
 */
async function updateProduct(productId, data) {
    const product = await Product.findByIdAndUpdate(productId, data, { new: true });
    if (!product) throw new Error("Product not found");
    return product;
}

/**
 * Xóa sản phẩm - soft delete (Admin)
 */
async function deleteProduct(productId) {
    const product = await Product.findByIdAndUpdate(
        productId,
        { status: "inactive" },
        { new: true }
    );
    if (!product) throw new Error("Product not found");
    return product;
}

/**
 * Tạo SKU cho sản phẩm
 */
async function createSKU(data) {
    const product = await Product.findById(data.product_id);
    if (!product) throw new Error("Product not found");

    // Auto-resolve color_id from Color collection
    if (data.color && !data.color_id) {
        const colorDoc = await Color.findOne({
            name: { $regex: new RegExp(`^${data.color.trim()}$`, 'i') }
        });
        if (colorDoc) {
            data.color_id = colorDoc._id;
        }
    }

    return await SKU.create(data);
}

/**
 * Lấy danh sách SKU của sản phẩm
 */
async function getSKUsByProduct(productId) {
    return await SKU.find({ product_id: productId });
}

/**
 * Lấy tất cả brands
 */
async function getAllBrands() {
    return await Product.distinct("brand", { status: "active" });
}

/**
 * Lấy tất cả sizes (distinct từ SKU của các product active)
 */
async function getAllSizes() {
    const activeProducts = await Product.find({ status: "active" }).select('_id');
    const productIds = activeProducts.map(p => p._id);
    const sizes = await SKU.distinct("size", { product_id: { $in: productIds } });
    return sizes.sort((a, b) => a - b);
}

/**
 * Lấy khoảng giá min/max của các product active
 */
async function getPriceRange() {
    const result = await Product.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, minPrice: { $min: "$price" }, maxPrice: { $max: "$price" } } },
    ]);
    if (result.length === 0) return { minPrice: 1000, maxPrice: 10000000 };
    return { minPrice: result[0].minPrice, maxPrice: result[0].maxPrice };
}

/**
 * Cập nhật trung bình sao cho sản phẩm
 */
async function updateProductRating(productId) {
    const stats = await Review.aggregate([
        { $match: { product_id: new mongoose.Types.ObjectId(productId) } },
        {
            $group: {
                _id: "$product_id",
                rating: { $avg: "$rating" },
                num_reviews: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        const avg = Math.round(stats[0].rating * 10) / 10;
        await Product.findByIdAndUpdate(productId, {
            rating: avg,
            num_reviews: stats[0].num_reviews
        });
    } else {
        await Product.findByIdAndUpdate(productId, {
            rating: 0,
            num_reviews: 0
        });
    }
}

/**
 * Lấy đánh giá sản phẩm
 */
async function getReviews(productId, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    
    const [reviews, totalCount] = await Promise.all([
        Review.find({ product_id: productId })
            .populate("user_id", "name avatar")
            .sort("-createdAt")
            .skip(skip)
            .limit(limit),
        Review.countDocuments({ product_id: productId })
    ]);

    return {
        reviews,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
        }
    };
}

/**
 * Thêm đánh giá
 */
async function addReview(productId, userId, { rating, comment }) {
    // 1. Kiểm tra xem người dùng đã mua sản phẩm (paid hoặc completed)
    const hasBought = await Order.findOne({
        customer_id: userId,
        "items.product_id": productId,
        status: { $in: ["paid", "completed"] }
    });
    
    if (!hasBought) {
        throw new Error("Chỉ có khách hàng đã mua sản phẩm mới được đánh giá");
    }

    // 2. Kiểm tra xem đã đánh giá chưa
    const existingReview = await Review.findOne({ product_id: productId, user_id: userId });
    if (existingReview) {
        throw new Error("Bạn đã đánh giá sản phẩm này rồi");
    }

    const review = await Review.create({
        product_id: productId,
        user_id: userId,
        rating,
        comment
    });

    await updateProductRating(productId);

    return review;
}

/**
 * Sửa đánh giá
 */
async function updateReview(reviewId, userId, { rating, comment }) {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error("Không tìm thấy đánh giá");

    if (review.user_id.toString() !== userId.toString()) {
        throw new Error("Bạn chỉ có quyền sửa bài đánh giá của mình");
    }

    review.rating = rating || review.rating;
    if (comment) review.comment = comment;
    await review.save();

    await updateProductRating(review.product_id);

    return review;
}

/**
 * Xóa đánh giá
 */
async function deleteReview(reviewId, userId) {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error("Không tìm thấy đánh giá");

    if (review.user_id.toString() !== userId.toString()) {
        throw new Error("Bạn chỉ có quyền xóa bài đánh giá của mình");
    }

    await Review.findByIdAndDelete(reviewId);

    await updateProductRating(review.product_id);

    return true;
}

module.exports = {
    getProducts,
    getProductDetail,
    createProduct,
    updateProduct,
    deleteProduct,
    createSKU,
    getSKUsByProduct,
    getAllBrands,
    getAllSizes,
    getPriceRange,
    getReviews,
    addReview,
    updateReview,
    deleteReview,
};
