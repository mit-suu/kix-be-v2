const baseDTO = require("./base.dto");
const userDTO = require("./user.dto");
const productDTO = require("./product.dto");
const storeDTO = require("./store.dto");
const cartDTO = require("./cart.dto");
const orderDTO = require("./order.dto");
const inventoryDTO = require("./inventory.dto");
const promotionDTO = require("./promotion.dto");

module.exports = {
  // Base
  baseDTO,

  // User
  ...userDTO,

  // Product
  ...productDTO,

  // Store
  ...storeDTO,

  // Cart
  ...cartDTO,

  // Order
  ...orderDTO,

  // Inventory
  ...inventoryDTO,

  // Promotion
  ...promotionDTO,
};
