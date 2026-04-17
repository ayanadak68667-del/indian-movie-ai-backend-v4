const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const homeCache = require("../services/homeCacheService");

// 🎭 Mood → Genre map
const MOOD_GENRES = {
  horror: 27,
  romance: 10749,
  action: 28,
  fun: 35,
  mindbend: 53
};

// ===============================
// ✅ HOME (AGGREGATED)
// ===============================
router.get("/", async (req, res) => {
  try {
    const mood = req.query.mood || "default";
    const safeMood = MOOD_GENRES[mood] ? mood : "default";

    const cacheKey = `home_${safeMood}`;

    const cached = await homeCache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, cached: true, data: cached });
    }

    const genreId = MOOD_GENRES[safeMood];

    let data;

    // 🟢 DEFAULT HOME
    if (!genreId) {
      const [trending, topRated, upcoming, webseries] =
        await Promise.all([
          tmdbService.getTrending(),
          tmdbService.getTopRated(),
          tmdbService.getUpcoming(),
          tmdbService.getPopularWebSeries()
        ]);

      data = {
        heroPicks: (trending?.results || []).slice(0, 3),
        trending: (trending?.results || []).slice(3, 8),
        topRated: (topRated?.results || []).slice(0, 5),
        upcoming: (upcoming?.results || []).slice(0, 5),
        webSeries: (webseries?.results || []).slice(0, 5)
      };
    }

    // 🔥 MOOD BASED
    else {
      const [moodMovies, moodWebSeries] =
        await Promise.all([
          tmdbService.discoverMovies({ genre: genreId }),
          tmdbService.getPopularWebSeries()
        ]);

      const results = moodMovies?.results || [];

      data = {
        heroPicks: results.slice(0, 3),
        trending: results.slice(3, 8),
        topRated: results.slice(8, 13),
        upcoming: results.slice(13, 18),
        webSeries: (moodWebSeries?.results || [])
          .filter((s) => s.genre_ids?.includes(genreId))
          .slice(0, 5)
      };
    }

    // 💾 Non-blocking cache
    homeCache.set(cacheKey, data);

    return res.json({ success: true, cached: false, data });

  } catch (err) {
    console.error("❌ HOME ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: "Homepage load failed"
    });
  }
});

// ===============================
// ✅ SECTION ROUTES (SAFE WRAPPER)
// ===============================
const sectionHandler = (key, fetchFn) => async (req, res) => {
  try {
    const cached = await homeCache.get(key);

    if (cached) {
      return res.json({ success: true, cached: true, data: cached });
    }

    const data = (await fetchFn())?.results || [];

    homeCache.set(key, data); // ⚡ non-blocking

    res.json({ success: true, cached: false, data });

  } catch (err) {
    console.error(`❌ ${key} ERROR:`, err.message);

    res.status(500).json({
      success: false,
      message: "Failed to load data"
    });
  }
};

// 🔹 Individual sections
router.get("/trending", sectionHandler("home_trending", tmdbService.getTrending));
router.get("/top-rated", sectionHandler("home_top_rated", tmdbService.getTopRated));
router.get("/upcoming", sectionHandler("home_upcoming", tmdbService.getUpcoming));
router.get("/webseries", sectionHandler("home_webseries", tmdbService.getPopularWebSeries));

module.exports = router;
