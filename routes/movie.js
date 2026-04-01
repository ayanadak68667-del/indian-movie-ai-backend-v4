const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const youtubeService = require("../services/youtubeService");
const { getDetailedAiAnalysis } = require("../services/groqService");
const mongoCache = require("../services/mongoCacheService");

const CACHE_TTL = 0; // 🔥 TEMP disable cache for testing

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

// ২️⃣ GET /api/movies/discover
router.get("/discover", async (req, res) => {
  try {
    const { genre, year, lang = "en" } = req.query;
    const data = await tmdbService.discoverMovies({ genre, year, lang });
    res.json({ success: true, data: data?.results || [] });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

// ৩️⃣ GET /api/movies/search
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
    // 🔁 CACHE CHECK
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

    // 🎬 TMDB DATA
    const movie = await tmdbService.getMovieDetails(movieId, lang);
    if (!movie) throw new Error("TMDB details failed");

    // 🪪 Certification
    const releaseDates = await tmdbService.getReleaseDates(movieId);
    const indiaRelease = releaseDates?.results?.find(r => r.iso_3166_1 === "IN");
    const cert = indiaRelease?.release_dates?.[0]?.certification || "UA 13+";

    // 🤖 AI + 📺 MEDIA + 📡 OTT
    const [aiAnalysisRaw, mediaRaw, watchProvidersRaw] = await Promise.all([
      getDetailedAiAnalysis(movie.title, lang).catch(() => ({})),
      youtubeService.getMovieMedia(movie.title, lang).catch(() => ({})),
      tmdbService.getWatchProviders(movieId).catch(() => ({}))
    ]);

    // 🔥 SAFE AI FALLBACK (VERY IMPORTANT)
    const aiAnalysis = {
      summary: aiAnalysisRaw.summary || "",
      story_blueprint: aiAnalysisRaw.story_blueprint || "",
      performance_spotlight: aiAnalysisRaw.performance_spotlight || [],
      behind_the_scenes: aiAnalysisRaw.behind_the_scenes || [],
      hits: aiAnalysisRaw.hits || [],
      misses: aiAnalysisRaw.misses || [],
      data_deep_dive: aiAnalysisRaw.data_deep_dive || {
        budget: "",
        box_office: "",
        verdict: ""
      },
      star_paychecks: aiAnalysisRaw.star_paychecks || [],
      credits: aiAnalysisRaw.credits || {
        director: "",
        box_office: ""
      }
    };

    // 🎥 SAFE MEDIA
    const media = {
      trailerId: mediaRaw.trailerId || "",
      playlist: mediaRaw.playlist || []
    };

    // 📊 META
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
      aiAnalysis, // ✅ FIXED
      trailerId: media.trailerId,
      playlist: media.playlist,
      watchProviders: watchProvidersRaw || {},
      meta,
      lastUpdated: new Date()
    };

    // 💾 SAVE CACHE
    await mongoCache.set(movieData);

    return res.json({
      success: true,
      data: { ...movieData, cached: false }
    });

  } catch (error) {
    console.error("Movie API Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
