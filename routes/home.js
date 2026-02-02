const express = require("express");
const router = express.Router();
console.log("✅ home.js route file LOADED");

const tmdbService = require("../services/tmdbService");
const homeCache = require("../services/homeCacheService");
console.log("homeCache:", homeCache);

/**
 * 🎭 Mood → TMDB Genre Mapping
 */
const MOOD_GENRES = {
  romance: 10749,
  action: 28,
  horror: 27,
  comedy: 35,
  thriller: 53,
  drama: 18
};

/* ======================================================
   🔹 STEP–2B : Individual Homepage Section APIs (24h)
   ====================================================== */

/**
 * 🔥 Trending Movies
 * GET /api/home/trending
 */
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
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

/**
 * ⭐ Top Rated Movies
 * GET /api/home/top-rated
 */
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
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

/**
 * ⏳ Upcoming Movies
 * GET /api/home/upcoming
 */
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
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

/**
 * 📺 Popular Web Series
 * GET /api/home/webseries
 */
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
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

/* ======================================================
   🔥 STEP–2C : Aggregated Homepage API (Mood Based)
   ====================================================== */

/**
 * 🚀 Single Homepage API
 * GET /api/home
 * GET /api/home?mood=romance
 */
router.get("/aggregate", async (req, res) => { ... })
  try {
    const requestedMood = req.query.mood;
    const mood = MOOD_GENRES[requestedMood] ? requestedMood : "default";
    const genreId = MOOD_GENRES[mood];

    const cacheKey = `home_aggregate_${mood}`;

    // 🔁 24h Cache Check
    const cached = await homeCache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        data: cached
      });
    }

    // 🔥 Parallel TMDB Calls
    const [
      trending,
      topRated,
      upcoming,
      webseries,
      moodMovies
    ] = await Promise.all([
      tmdbService.getTrending(),
      tmdbService.getTopRated(),
      tmdbService.getUpcoming(),
      tmdbService.getPopularWebSeries(),
      genreId ? tmdbService.discoverMovies({ genre: genreId }) : null
    ]);

    const responseData = {
      /**
       * 🎯 Hero Section
       */
      heroPicks: genreId
        ? (moodMovies?.results || []).slice(0, 3)
        : (trending?.results || []).slice(0, 3),

      /**
       * 🎭 Mood Picks (only when mood selected)
       */
      moodPicks: genreId
        ? (moodMovies?.results || []).slice(3, 13)
        : [],

      /**
       * 🔥 Global Sections
       */
      trending: trending?.results || [],
      topRated: topRated?.results || [],
      upcoming: upcoming?.results || [],
      webSeries: webseries?.results || []
    };

    // 💾 Save Aggregated Cache (24h)
    await homeCache.set(cacheKey, responseData);

    res.json({
      success: true,
      cached: false,
      data: responseData
    });

  } catch (error) {
    console.error("Homepage Aggregation Error:", error);
    res.status(500).json({
      success: false,
      message: "Homepage aggregation failed"
    });
  }
});

module.exports = router;
