// asyncHandler wraps any async route function so we don't have to write
// try/catch in every controller. If the async function throws an error,
// it automatically passes it to Express's error handler (next).
//
// Usage in a route:
//   router.get('/', asyncHandler(async (req, res) => {
//     const data = await db.query(...);
//     res.json({ success: true, data });
//   }));

const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default asyncHandler;
