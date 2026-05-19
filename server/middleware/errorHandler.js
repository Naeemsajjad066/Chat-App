/**
 * Central error-handling middleware.
 * Must be registered LAST in Express (after all routes).
 */
export const errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Internal server error."
      : err.message || "Something went wrong.";

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${status}: ${message}`);

  res.status(status).json({ success: false, message });
};

/**
 * Wraps an async route handler so unhandled promise rejections
 * are forwarded to the error handler instead of crashing the process.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
