// This utility wraps our async controller functions.
// It catches any errors and passes them to Express's global error handler (next),
// meaning we don't have to write try-catch blocks in every single controller.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
