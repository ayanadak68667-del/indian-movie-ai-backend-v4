const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const homeCache = require("../services/homeCacheService");

// 🎭 Mood → Genre map
const MOOD_GENRES = {
  horror: 27,       // 👻 Horror
  romance: 10749,   // 💖 Romance
  action: 28,       // 🔥 Action
  fun: 35,          // 😂 Fun (Comedy)
  mindbend: 53      // 🧠 Mind-Bend (Thriller)
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

    // 🟢 CASE 1: NO MOOD (Default Homepage)
    if (!genreId) {
      const [trending, topRated, upcoming, webseries] = await Promise.all([
        tmdbService.getTrending(),
        tmdbService.getTopRated(),
        tmdbService.getUpcoming(),
        tmdbService.getPopularWebSeries()
      ]);

      const data = {
  heroPicks: (trending?.results || []).slice(0, 3),

  trending: (trending?.results || []).slice(3, 8),

  topRated: (topRated?.results || []).slice(0, 5),

  upcoming: (upcoming?.results || []).slice(0, 5),

  webSeries: (webseries && webseries.results)
    ? webseries.results.slice(0, 5)
    : []
};

      await homeCache.set(cacheKey, data);
      return res.json({ success: true, cached: false, data });
    }

    // 🔥 CASE 2: MOOD SELECTED (FULLY MOOD-AWARE HOME)
    const [moodMovies, moodWebSeries] = await Promise.all([
      tmdbService.discoverMovies({ genre: genreId }),
      tmdbService.getPopularWebSeries()
    ]);

    const results = moodMovies?.results || [];

    const data = {
      heroPicks: results.slice(0, 3),
      trending: results.slice(3, 8),
      topRated: results.slice(8, 13),
      upcoming: results.slice(13, 18),
      webSeries: (moodWebSeries?.results || []).filter(
        s => s.genre_ids?.includes(genreId)
      ).slice(0, 5)
    };

    await homeCache.set(cacheKey, data);

    res.json({ success: true, cached: false, data });

  } catch (err) {
    console.error("HOME OPTION-1 ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Homepage load failed"
    });
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
