const express = require("express");
const router = express.Router();
const Movie = require("../models/Movie");

// 🔐 Simple Admin Auth Middleware
const adminAuth = (req, res, next) => {
  const token = req.headers.authorization;

  if (token !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  next();
};

// 🗑️ Delete single movie cache
router.delete("/cache/movie/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  const lang = req.query.lang || "en";
  const cacheKey = `${id}_${lang}`;

  await Movie.deleteOne({ tmdbId: cacheKey });

  res.json({
    success: true,
    message: "Movie cache deleted"
  });
});

// 💥 Delete all cache
router.delete("/cache/all", adminAuth, async (req, res) => {
  await Movie.deleteMany({});

  res.json({
    success: true,
    message: "All cache cleared"
  });
});

// 🔄 Force refresh (delete + next call will refetch)
router.post("/cache/refresh/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  const lang = req.query.lang || "en";
  const cacheKey = `${id}_${lang}`;

  await Movie.deleteOne({ tmdbId: cacheKey });

  res.json({
    success: true,
    message: "Cache cleared. Next request will fetch fresh data."
  });
});

module.exports = router;
