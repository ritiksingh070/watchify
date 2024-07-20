// Wrapping synchronous and asynchronous route handlers with error handling.
const asyncHandler = (reqHandler) => (
    // Returning a middleware function that handles promises and catches errors.
    (req, res, next) => {
      Promise.resolve(reqHandler(req, res, next))
        .catch((err) => next(err));
    }
  );

export { asyncHandler }


// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }