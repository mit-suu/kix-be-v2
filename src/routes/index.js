const authRouter = require("./auth.routes");
const userRouter = require("./user.routes");
const productRouter = require("./product.routes");
const storeRouter = require("./store.routes");
const cartRouter = require("./cart.routes");
const orderRouter = require("./order.routes");
const inventoryRouter = require("./inventory.routes");
const stockTicketRouter = require("./stock-ticket.routes");
const colorRouter = require("./color.routes");
const promotionRouter = require("./promotion.routes");
const { vnpayReturn, paymentServiceCallback } = require("../controllers/order.controller");

function route(app) {
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/products", productRouter);
  app.use("/api/v1/stores", storeRouter);
  app.use("/api/v1/cart", cartRouter);

  // Public VNPay return URL — đăng ký trước orderRouter để bypass authenticate middleware
  app.get("/api/v1/orders/vnpay/return", vnpayReturn);
  app.post("/api/v1/orders/payment-callback", paymentServiceCallback);

  app.use("/api/v1/orders", orderRouter);
  app.use("/api/v1/inventory", inventoryRouter);
  app.use("/api/v1/stock-tickets", stockTicketRouter);
  app.use("/api/v1/colors", colorRouter);
  app.use("/api/v1/promotions", promotionRouter);
}

module.exports = route;
