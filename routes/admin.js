const express = require("express");
const router = express.Router();
const Movie = require("../models/Movie");

// 🔐 Secure Admin Auth Middleware
const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    if (token !== process.env.ADMIN_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Auth failed"
    });
  }
};

// 🗑️ Delete single movie cache
router.delete("/cache/movie/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.query.lang || "en";

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID"
      });
    }

    const cacheKey = `${id}_${lang}`;

    await Movie.deleteOne({ tmdbId: cacheKey });

    res.json({
      success: true,
      message: "Movie cache deleted"
    });
  } catch (error) {
    console.error("Delete Movie Cache Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete cache"
    });
  }
});

// 💥 Delete all cache
router.delete("/cache/all", adminAuth, async (req, res) => {
  try {
    await Movie.deleteMany({});

    res.json({
      success: true,
      message: "All cache cleared"
    });
  } catch (error) {
    console.error("Delete All Cache Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to clear cache"
    });
  }
});

// 🔄 Force refresh
router.post("/cache/refresh/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.query.lang || "en";

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID"
      });
    }

    const cacheKey = `${id}_${lang}`;

    await Movie.deleteOne({ tmdbId: cacheKey });

    res.json({
      success: true,
      message: "Cache cleared. Next request will fetch fresh data."
    });
  } catch (error) {
    console.error("Refresh Cache Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to refresh cache"
    });
  }
});

module.exports = router;
