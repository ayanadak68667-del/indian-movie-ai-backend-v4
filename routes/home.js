const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const homeCache = require("../services/homeCacheService");

// 🖼️ Image Base URL & Transformer function
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const transformMovie = (m) => ({
  ...m,
  poster: m.poster_path
    ? `${IMAGE_BASE}${m.poster_path}`
    : null,
  backdrop: m.backdrop_path
    ? `${IMAGE_BASE}${m.backdrop_path}`
    : null
});

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

      // 🔥 Added .map(transformMovie)
      data = {
        heroPicks: (trending?.results || []).slice(0, 3).map(transformMovie),
        trending: (trending?.results || []).slice(3, 8).map(transformMovie),
        topRated: (topRated?.results || []).slice(0, 5).map(transformMovie),
        upcoming: (upcoming?.results || []).slice(0, 5).map(transformMovie),
        webSeries: (webseries?.results || []).slice(0, 5).map(transformMovie)
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

      // 🔥 Added .map(transformMovie)
      data = {
        heroPicks: results.slice(0, 3).map(transformMovie),
        trending: results.slice(3, 8).map(transformMovie),
        topRated: results.slice(8, 13).map(transformMovie),
        upcoming: results.slice(13, 18).map(transformMovie),
        webSeries: (moodWebSeries?.results || [])
          .filter((s) => s.genre_ids?.includes(genreId))
          .slice(0, 5)
          .map(transformMovie)
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

    // 🔥 Added .map(transformMovie) for individual sections as well
    const data = ((await fetchFn())?.results || []).map(transformMovie);

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
