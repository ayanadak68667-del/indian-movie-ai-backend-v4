const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const homeCache = require("../services/homeCacheService");

// 🎭 Mood → Genre map
const MOOD_GENRES = {
  romance: 10749,
  action: 28,
  horror: 27,
  comedy: 35,
  thriller: 53,
  drama: 18
};

/* ===============================
   ✅ AGGREGATED HOME (ROOT)
   GET /api/home
================================ */
router.get("/", async (req, res) => {
  try {
    const mood = req.query.mood || "default";
    const cacheKey = `home_${mood}`;

    const cached = await homeCache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, cached: true, data: cached });
    }

    const genreId = MOOD_GENRES[mood];

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

    const data = {
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

    await homeCache.set(cacheKey, data);

    res.json({ success: true, cached: false, data });
  } catch (err) {
    console.error("HOME AGGREGATE ERROR:", err);
    res.status(500).json({ success: false, message: "Home aggregation failed" });
  }
});

/* ===============================
   ✅ INDIVIDUAL SECTIONS
================================ */

router.get("/trending", async (req, res) => {
  const key = "home_trending";
  const cached = await homeCache.get(key);
  if (cached) return res.json({ success: true, cached: true, data: cached });

  const data = (await tmdbService.getTrending())?.results || [];
  await homeCache.set(key, data);
  res.json({ success: true, cached: false, data });
});

router.get("/top-rated", async (req, res) => {
  const key = "home_top_rated";
  const cached = await homeCache.get(key);
  if (cached) return res.json({ success: true, cached: true, data: cached });

  const data = (await tmdbService.getTopRated())?.results || [];
  await homeCache.set(key, data);
  res.json({ success: true, cached: false, data });
});

router.get("/upcoming", async (req, res) => {
  const key = "home_upcoming";
  const cached = await homeCache.get(key);
  if (cached) return res.json({ success: true, cached: true, data: cached });

  const data = (await tmdbService.getUpcoming())?.results || [];
  await homeCache.set(key, data);
  res.json({ success: true, cached: false, data });
});

router.get("/webseries", async (req, res) => {
  const key = "home_webseries";
  const cached = await homeCache.get(key);
  if (cached) return res.json({ success: true, cached: true, data: cached });

  const data = (await tmdbService.getPopularWebSeries())?.results || [];
  await homeCache.set(key, data);
  res.json({ success: true, cached: false, data });
});

module.exports = router;
