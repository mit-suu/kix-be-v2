const Color = require("../models/color.model");

/**
 * Lấy tất cả colors
 */
async function getAll() {
    return await Color.find().sort("name");
}

/**
 * Tạo color mới
 */
async function create(data) {
    // Check duplicate slug
    const slug =
        data.slug ||
        data.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");

    const exists = await Color.findOne({ slug });
    if (exists) throw new Error("Color with this name already exists");

    return await Color.create({ ...data, slug });
}

/**
 * Cập nhật color
 */
async function update(id, data) {
    // If name changed, regenerate slug
    if (data.name && !data.slug) {
        data.slug = data.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    }

    // Check duplicate slug (exclude self)
    if (data.slug) {
        const exists = await Color.findOne({ slug: data.slug, _id: { $ne: id } });
        if (exists) throw new Error("Color with this name already exists");
    }

    const color = await Color.findByIdAndUpdate(id, data, { new: true });
    if (!color) throw new Error("Color not found");
    return color;
}

/**
 * Xóa color
 */
async function remove(id) {
    const color = await Color.findByIdAndDelete(id);
    if (!color) throw new Error("Color not found");
    return color;
}

module.exports = {
    getAll,
    create,
    update,
    remove,
};
