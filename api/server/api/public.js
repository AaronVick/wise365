const { Router } = require('express');
const router = Router();

router.get('/get-user', (req, res) => {
  console.log(req.user);
  res.json({ user: req.user || null });
});

router.post('/get-user-by-slug', async (req, res, next) => {
  try {
    const { slug } = req.body;

    // Replace with actual user-fetching logic.
    const user = {}; // Dummy placeholder
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
