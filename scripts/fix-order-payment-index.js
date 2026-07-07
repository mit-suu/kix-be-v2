require("dotenv").config();
const mongoose = require("mongoose");

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const orders = mongoose.connection.db.collection("orders");

  await orders.updateMany(
    { payment_order_id: null },
    { $unset: { payment_order_id: "" } }
  );

  const indexes = await orders.indexes();
  const existingIndex = indexes.find((index) => index.name === "payment_order_id_1");

  if (existingIndex) {
    await orders.dropIndex("payment_order_id_1");
  }

  await orders.createIndex(
    { payment_order_id: 1 },
    {
      name: "payment_order_id_1",
      unique: true,
      partialFilterExpression: { payment_order_id: { $type: "string" } },
    }
  );

  console.log("Fixed orders.payment_order_id unique partial index");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
