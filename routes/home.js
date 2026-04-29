const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const homeCache = require("../services/homeCacheService");

// ===============================
// 🖼️ IMAGE TRANSFORM
// ===============================
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const transformMovie = (m) => ({
  ...m,
  poster: m.poster_path ? `${IMAGE_BASE}${m.poster_path}` : null,
  backdrop: m.backdrop_path ? `${IMAGE_BASE}${m.backdrop_path}` : null
});

// ===============================
// 🎭 MOOD → GENRE MAP
// ===============================
const MOOD_GENRES = {
  horror: 27,
  romance: 10749,
  action: 28,
  fun: 35,
  mindbend: 53
};

// ===============================
// 🧠 HELPERS
// ===============================
const safeResults = (data) => data?.results || [];

const uniqueById = (arr) => {
  const seen = new Set();

  return arr.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const pickChunk = (arr, start, count) =>
  arr.slice(start, start + count).map(transformMovie);

// ===============================
// ✅ HOME ROUTE
// ===============================
router.get("/", async (req, res) => {
  try {
    const mood = req.query.mood || "default";
    const safeMood = MOOD_GENRES[mood] ? mood : "default";

    const cacheKey = `home_${safeMood}`;

    const cached = await homeCache.get(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        cached: true,
        data: cached
      });
    }

    let data;

    // ===============================
    // 🟢 DEFAULT HOME
    // ===============================
    if (safeMood === "default") {
      const [trending, topRated, upcoming, webseries] =
        await Promise.all([
          tmdbService.getTrending(),
          tmdbService.getTopRated(),
          tmdbService.getUpcoming(),
          tmdbService.getPopularWebSeries()
        ]);

      const trend = uniqueById(safeResults(trending));
      const top = uniqueById(safeResults(topRated));
      const up = uniqueById(safeResults(upcoming));
      const web = uniqueById(safeResults(webseries));

      data = {
        heroPicks: pickChunk(trend, 0, 3),
        trending: pickChunk(trend, 3, 10),
        topRated: pickChunk(top, 0, 8),
        upcoming: pickChunk(up, 0, 8),
        webSeries: pickChunk(web, 0, 8)
      };
    }

    // ===============================
    // 🔥 MOOD HOME
    // ===============================
    else {
      const genreId = MOOD_GENRES[safeMood];

      const [movies, webseries] =
        await Promise.all([
          tmdbService.discoverMovies({ genre: genreId }),
          tmdbService.getPopularWebSeries()
        ]);

      const moodMovies = uniqueById(safeResults(movies));
      const moodWeb = uniqueById(
        safeResults(webseries).filter((s) =>
          s.genre_ids?.includes(genreId)
        )
      );

      data = {
        heroPicks: pickChunk(moodMovies, 0, 3),
        trending: pickChunk(moodMovies, 3, 10),
        topRated: pickChunk(moodMovies, 13, 8),
        upcoming: pickChunk(moodMovies, 21, 8),
        webSeries: pickChunk(moodWeb, 0, 8)
      };
    }

    // ===============================
    // 💾 CACHE SAVE (24h handled in service)
    // ===============================
    homeCache.set(cacheKey, data);

    return res.json({
      success: true,
      cached: false,
      data
    });

  } catch (err) {
    console.error("❌ HOME ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Homepage load failed"
    });
  }
});

// ===============================
// ✅ SAFE SECTION ROUTES
// ===============================
const sectionHandler = (key, fetchFn) => async (req, res) => {
  try {
    const cached = await homeCache.get(key);

    if (cached) {
      return res.json({
        success: true,
        cached: true,
        data: cached
      });
    }

    const results = uniqueById(safeResults(await fetchFn()));
    const data = results.map(transformMovie);

    homeCache.set(key, data);

    return res.json({
      success: true,
      cached: false,
      data
    });

  } catch (err) {
    console.error(`❌ ${key} ERROR:`, err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load data"
    });
  }
};

// ===============================
// 🎬 INDIVIDUAL ROUTES
// ===============================
router.get(
  "/trending",
  sectionHandler("home_trending", tmdbService.getTrending)
);

router.get(
  "/top-rated",
  sectionHandler("home_top_rated", tmdbService.getTopRated)
);

router.get(
  "/upcoming",
  sectionHandler("home_upcoming", tmdbService.getUpcoming)
);

router.get(
  "/webseries",
  sectionHandler("home_webseries", tmdbService.getPopularWebSeries)
);

module.exports = router;
