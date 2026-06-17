const User = require("./user.model");
const Store = require("./store.model");
const Product = require("./product.model");
const SKU = require("./sku.model");
const Inventory = require("./inventory.model");
const InventoryHistory = require("./inventory-history.model");
const StockTicket = require("./stock-ticket.model");
const Cart = require("./cart.model");
const Order = require("./order.model");
const Color = require("./color.model");
const Promotion = require("./promotion.model");

module.exports = {
  User,
  Store,
  Product,
  SKU,
  Inventory,
  InventoryHistory,
  StockTicket,
  Cart,
  Order,
  Color,
  Promotion,
};
