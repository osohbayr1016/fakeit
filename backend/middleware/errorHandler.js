// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.stack);

  // Default error
  let error = {
    message: err.message || "Something went wrong!",
    status: err.status || 500,
  };

  // Handle specific error types
  if (err.name === "ValidationError") {
    error.status = 400;
    error.message = "Validation Error";
    error.details = err.details;
  }

  if (err.name === "UnauthorizedError") {
    error.status = 401;
    error.message = "Unauthorized";
  }

  // Send error response
  res.status(error.status).json({
    error: error.message,
    status: error.status,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
