 const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const homeCache = require("../services/homeCacheService");

// 🔥 Trending Movies (24h cache)
router.get("/trending", async (req, res) => {
  try {
    const cacheKey = "home_trending";
    const cached = await homeCache.get(cacheKey);

    if (cached) {
      return res.json({ success: true, cached: true, data: cached });
    }

    const data = await tmdbService.getTrending();
    const results = data?.results || [];

    await homeCache.set(cacheKey, results);

    res.json({ success: true, cached: false, data: results });
  } catch (e) {
    res.status(500).json({ success: false, data: [] });
  }
});

// ⭐ Top Rated Movies (24h cache)
router.get("/top-rated", async (req, res) => {
  try {
    const cacheKey = "home_top_rated";
    const cached = await homeCache.get(cacheKey);

    if (cached) {
      return res.json({ success: true, cached: true, data: cached });
    }

    const data = await tmdbService.getTopRated();
    const results = data?.results || [];

    await homeCache.set(cacheKey, results);

    res.json({ success: true, cached: false, data: results });
  } catch (e) {
    res.status(500).json({ success: false, data: [] });
  }
});

// ⏳ Upcoming Movies (24h cache)
router.get("/upcoming", async (req, res) => {
  try {
    const cacheKey = "home_upcoming";
    const cached = await homeCache.get(cacheKey);

    if (cached) {
      return res.json({ success: true, cached: true, data: cached });
    }

    const data = await tmdbService.getUpcoming();
    const results = data?.results || [];

    await homeCache.set(cacheKey, results);

    res.json({ success: true, cached: false, data: results });
  } catch (e) {
    res.status(500).json({ success: false, data: [] });
  }
});

// 📺 Popular Web Series (24h cache)
router.get("/webseries", async (req, res) => {
  try {
    const cacheKey = "home_webseries";
    const cached = await homeCache.get(cacheKey);

    if (cached) {
      return res.json({ success: true, cached: true, data: cached });
    }

    const data = await tmdbService.getPopularWebSeries();
    const results = data?.results || [];

    await homeCache.set(cacheKey, results);

    res.json({ success: true, cached: false, data: results });
  } catch (e) {
    res.status(500).json({ success: false, data: [] });
  }
});

module.exports = router;
