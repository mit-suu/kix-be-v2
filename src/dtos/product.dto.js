// Product DTOs

// Response DTO
function productResponseDTO(product) {
  if (!product) return null;

  return {
    id: product._id,
    name: product.name,
    brand: product.brand,
    description: product.description,
    images: product.images,
    price: product.price,
    status: product.status,
    rating: product.rating || 0,
    num_reviews: product.num_reviews || 0,
    createdAt: product.createdAt,
  };
}

// Product List Response
function productListResponseDTO(products) {
  return products.map(productResponseDTO);
}

// Product Detail with SKUs and Availability
function productDetailResponseDTO(product, skus, availability) {
  return {
    product: productResponseDTO(product),
    skus: skus.map((sku) => ({
      id: sku._id,
      size: sku.size,
      color: sku.color,
      sku_code: sku.sku_code,
    })),
    availability: availability.map((store) => ({
      store_id: store.store_id,
      store_name: store.store_name,
      store_address: store.store_address,
      skus: store.skus,
    })),
  };
}

// Create Product DTO
function createProductDTO(data) {
  const errors = [];

  if (!data.name) errors.push("Product name is required");
  if (!data.brand) errors.push("Brand is required");
  if (!data.price || Number(data.price) < 1000) errors.push("Giá phải tối thiểu 1000 VND");

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      name: data.name?.trim(),
      brand: data.brand?.trim(),
      description: data.description?.trim() || "",
      images: data.images || [],
      price: Number(data.price),
      status: data.status || "active",
    },
  };
}

// Update Product DTO
function updateProductDTO(data) {
  if (!data) data = {};
  const cleanData = {};

  if (data.name !== undefined) cleanData.name = data.name?.trim();
  if (data.brand !== undefined) cleanData.brand = data.brand?.trim();
  if (data.description !== undefined) cleanData.description = data.description?.trim();
  if (data.images !== undefined) cleanData.images = data.images;
  if (data.price !== undefined) cleanData.price = Number(data.price);
  if (data.status !== undefined) cleanData.status = data.status;

  return cleanData;
}

module.exports = {
  productResponseDTO,
  productListResponseDTO,
  productDetailResponseDTO,
  createProductDTO,
  updateProductDTO,
};
