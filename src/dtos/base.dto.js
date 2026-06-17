function baseDTO({
  success = true,
  message = "",
  data = null,
  error = null,
  meta = null,
}) {
  const response = { success, message };

  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  if (!success && error) response.error = error;

  return response;
}

module.exports = baseDTO;
