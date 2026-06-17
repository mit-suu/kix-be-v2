// Store DTOs

// Response DTO
function storeResponseDTO(store) {
  if (!store) return null;

  const dto = {
    id: store._id,
    name: store.name,
    address: store.address,
    phone: store.phone,
    manager_id: store.manager_id?._id || store.manager_id || null,
    manager: store.manager_id && typeof store.manager_id === 'object' ? {
      id: store.manager_id._id,
      name: store.manager_id.name,
      email: store.manager_id.email,
    } : null,
    status: store.status,
    // Display fields
    hours: store.hours || "09:00 - 22:00",
    image: store.image || null,
    badge: store.badge || null,
    featured: store.featured ?? false,
    features: store.features || [],
    lat: store.lat ?? null,
    lng: store.lng ?? null,
    createdAt: store.createdAt,
  };

  return dto;
}

// Store List Response
function storeListResponseDTO(stores) {
  return stores.map(storeResponseDTO);
}

// Create Store DTO
function createStoreDTO(data) {
  const errors = [];

  if (!data.name) errors.push("Store name is required");
  if (!data.address) errors.push("Address is required");

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      name: data.name?.trim(),
      address: data.address?.trim(),
      phone: data.phone?.trim() || null,
      manager_id: data.manager_id || null,
      status: data.status || "active",
      hours: data.hours?.trim() || "09:00 - 22:00",
      image: data.image?.trim() || null,
      badge: data.badge?.trim() || null,
      featured: data.featured ?? false,
      features: Array.isArray(data.features) ? data.features : [],
      lat: data.lat != null ? Number(data.lat) : null,
      lng: data.lng != null ? Number(data.lng) : null,
    },
  };
}

// Update Store DTO
function updateStoreDTO(data) {
  const cleanData = {};

  if (data.name !== undefined) cleanData.name = data.name?.trim();
  if (data.address !== undefined) cleanData.address = data.address?.trim();
  if (data.phone !== undefined) cleanData.phone = data.phone?.trim();
  if (data.manager_id !== undefined) cleanData.manager_id = data.manager_id || null;
  if (data.status !== undefined) cleanData.status = data.status;
  if (data.hours !== undefined) cleanData.hours = data.hours?.trim();
  if (data.image !== undefined) cleanData.image = data.image?.trim() || null;
  if (data.badge !== undefined) cleanData.badge = data.badge?.trim() || null;
  if (data.featured !== undefined) cleanData.featured = data.featured;
  if (data.features !== undefined) cleanData.features = Array.isArray(data.features) ? data.features : [];
  if (data.lat !== undefined) cleanData.lat = data.lat != null ? Number(data.lat) : null;
  if (data.lng !== undefined) cleanData.lng = data.lng != null ? Number(data.lng) : null;

  return cleanData;
}

module.exports = {
  storeResponseDTO,
  storeListResponseDTO,
  createStoreDTO,
  updateStoreDTO,
};
