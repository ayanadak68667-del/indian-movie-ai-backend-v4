const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const youtubeService = require("../services/youtubeService");
const { getDetailedAiAnalysis } = require("../services/groqService");
const mongoCache = require("../services/mongoCacheService");

const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

// ১️⃣ GET /api/movies/trending
router.get("/trending", async (req, res) => {
  try {
    const lang = req.query.lang || "en";
    const data = await tmdbService.getTrending(lang);
    res.json({ success: true, data: data?.results || [] });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

// ২️⃣ GET /api/movies/discover?genre=&year=
router.get("/discover", async (req, res) => {
  try {
    const { genre, year, lang = "en" } = req.query;
    const data = await tmdbService.discoverMovies({ genre, year, lang });
    res.json({ success: true, data: data?.results || [] });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

// ৩️⃣ GET /api/movies/search?q=
router.get("/search", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();
    const lang = req.query.lang || "en";

    if (query.length < 2)
      return res.json({ success: true, data: [] });

    const data = await tmdbService.searchMulti(query, lang);
    res.json({ success: true, data: data?.results || [] });
  } catch {
    res.status(500).json({ success: false, data: [] });
  }
});

// ৪️⃣ GET /api/movies/movie/:id
router.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;
  const lang = req.query.lang || "en";
  const cacheKey = `${movieId}_${lang}`;

  try {
    // 🔁 ক্যাশ চেক
    const cachedMovie = await mongoCache.get(cacheKey);

    const isStale = cachedMovie?.lastUpdated
      ? Date.now() - new Date(cachedMovie.lastUpdated).getTime() > CACHE_TTL
      : true;

    if (cachedMovie && !isStale) {
      return res.json({
        success: true,
        data: { ...cachedMovie, cached: true }
      });
    }

    // 🎬 TMDB ডিটেইলস
    const movie = await tmdbService.getMovieDetails(movieId, lang);
    if (!movie) throw new Error("TMDB details failed");

    // 🪪 ভারতের সার্টিফিকেশন
    const releaseDates = await tmdbService.getReleaseDates(movieId);
    const indiaRelease = releaseDates?.results?.find(r => r.iso_3166_1 === "IN");
    const cert = indiaRelease?.release_dates?.[0]?.certification || "UA 13+";

    // 🤖 AI + 📺 YouTube + 📡 OTT একসাথে ফেচ
    const [aiAnalysis, media, watchProviders] = await Promise.all([
      getDetailedAiAnalysis(movie.title, lang).catch(() => ({})),
      youtubeService.getMovieMedia(movie.title, lang).catch(() => ({ trailerId: "", playlist: [] })),
      tmdbService.getWatchProviders(movieId).catch(() => ({}))
    ]);

    // 📊 মেটা ব্যাজ ডেটা
    const meta = {
      isTrending: (movie.popularity || 0) > 100,
      isNew: movie.release_date
        ? (Date.now() - new Date(movie.release_date)) / 86400000 < 60
        : false,
      popularity: movie.popularity || 0,
      imdbRating: movie.vote_average || 0,
      certification: cert
    };

    const movieData = {
      tmdbId: cacheKey,
      details: movie,
      aiAnalysis,
      trailerId: media.trailerId,
      playlist: media.playlist,
      watchProviders,
      meta,
      lastUpdated: new Date()
    };

    // 💾 ক্যাশে সেভ/আপডেট
    await mongoCache.set(movieData);

    return res.json({
      success: true,
      data: { ...movieData, cached: false }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
