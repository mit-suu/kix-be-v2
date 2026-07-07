const DEFAULT_PAYMENT_SERVICE_URL =
  "https://payment-service-cfavf0dphzdnctb8.southeastasia-01.azurewebsites.net";

function getPaymentConfig() {
  const baseUrl = (process.env.PAYMENT_SERVICE_URL || DEFAULT_PAYMENT_SERVICE_URL).replace(/\/+$/, "");
  const clientId = process.env.PAYMENT_CLIENT_ID;
  const apiKey = process.env.PAYMENT_API_KEY;

  if (!clientId || !apiKey) {
    throw new Error("Payment service credentials are not configured");
  }

  return { baseUrl, clientId, apiKey };
}

async function requestPaymentService(path, options = {}) {
  const { baseUrl, clientId, apiKey } = getPaymentConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-api-key": apiKey,
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || "Payment service request failed");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function createPaymentOrder({ amount, description, callbackUrl }) {
  return requestPaymentService("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      amount,
      description,
      callback_url: callbackUrl,
    }),
  });
}

async function getPaymentOrder(orderId) {
  return requestPaymentService(`/api/orders/${encodeURIComponent(orderId)}`);
}

function getExpectedClientId() {
  return process.env.PAYMENT_CLIENT_ID;
}

module.exports = {
  createPaymentOrder,
  getPaymentOrder,
  getExpectedClientId,
};
