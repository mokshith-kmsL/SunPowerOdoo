// These helpers send consistent JSON responses across all routes.
//
// Every API response uses the same shape:
//   Success: { success: true,  message: "...", data: {...} }
//   Error:   { success: false, message: "..." }
//
// This makes it easy for the frontend to handle responses predictably.

export function sendSuccess(res, message, data = null) {
  const response = { success: true, message };
  if (data !== null) {
    response.data = data;
  }
  return res.status(200).json(response);
}

export function sendCreated(res, message, data = null) {
  const response = { success: true, message };
  if (data !== null) {
    response.data = data;
  }
  return res.status(201).json(response);
}

export function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ success: false, message });
}
