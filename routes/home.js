const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const homeCache = require("../services/homeCacheService");

// 🎭 Mood → Genre mapping
const MOOD_GENRES = {
  romance: 10749,
  action: 28,
  horror: 27,
  comedy: 35,
  thriller: 53,
  drama: 18
};

// 🔥 Trending Movies
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

// ⭐ Top Rated
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

// ⏳ Upcoming
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

// 📺 Web Series
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

// 🚀 Aggregated Homepage
router.get("/", async (req, res) => {
  try {
    const mood = req.query.mood || "default";
    const cacheKey = `home_aggregate_${mood}`;

    const cached = await homeCache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, cached: true, data: cached });
    }

    const genreId = MOOD_GENRES[mood];

    const [trending, topRated, upcoming, webseries, moodMovies] =
      await Promise.all([
        tmdbService.getTrending(),
        tmdbService.getTopRated(),
        tmdbService.getUpcoming(),
        tmdbService.getPopularWebSeries(),
        genreId ? tmdbService.discoverMovies({ genre: genreId }) : null
      ]);

    const responseData = {
      heroPicks: genreId
        ? (moodMovies?.results || []).slice(0, 3)
        : (trending?.results || []).slice(0, 3),

      trending: genreId
        ? (moodMovies?.results || []).slice(3, 13)
        : (trending?.results || []),

      topRated: topRated?.results || [],
      upcoming: upcoming?.results || [],
      webSeries: webseries?.results || []
    };

    await homeCache.set(cacheKey, responseData);

    res.json({ success: true, cached: false, data: responseData });

  } catch (error) {
    console.error("Home Aggregation Error:", error);
    res.status(500).json({
      success: false,
      message: "Homepage aggregation failed"
    });
  }
});

module.exports = router;
