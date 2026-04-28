const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const youtubeService = require("../services/youtubeService");
const { getDetailedAiAnalysis } = require("../services/groqService");
const mongoCache = require("../services/mongoCacheService");

// 🖼️ Image Base URL & Transformer function (View More পেজের ছবির জন্য)
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const transformMovie = (m) => ({
  ...m,
  poster: m.poster_path ? `${IMAGE_BASE}${m.poster_path}` : null,
  backdrop: m.backdrop_path ? `${IMAGE_BASE}${m.backdrop_path}` : null
});

// ১️⃣ TRENDING
router.get("/trending", async (req, res) => {
  try {
    const lang = req.query.lang || "en";
    const data = await tmdbService.getTrending(lang);
    
    // ছবিগুলো ফরম্যাট করা হচ্ছে
    const formattedData = (data?.results || []).map(transformMovie);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Trending Error:", error.message);
    res.status(500).json({ success: false, data: [] });
  }
});

// ২️⃣ DISCOVER
router.get("/discover", async (req, res) => {
  try {
    const { genre, year, lang = "en" } = req.query;
    const data = await tmdbService.discoverMovies({ genre, year, lang });
    
    const formattedData = (data?.results || []).map(transformMovie);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Discover Error:", error.message);
    res.status(500).json({ success: false, data: [] });
  }
});

// ৩️⃣ SEARCH
router.get("/search", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();
    const lang = req.query.lang || "en";

    if (query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const data = await tmdbService.searchMulti(query, lang);
    const formattedData = (data?.results || []).map(transformMovie);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(500).json({ success: false, data: [] });
  }
});

// ৪️⃣ MOVIE DETAILS
router.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;
  const lang = req.query.lang || "en";

  // ✅ Validation
  if (!movieId || isNaN(movieId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid movie ID"
    });
  }

  const cacheKey = `${movieId}_${lang}`;

  try {
    // 🔁 CACHE CHECK
    const cachedMovie = await mongoCache.get(cacheKey);

    if (cachedMovie) {
      // 🔥 FIX FOR MONGOOSE SPREAD BUG 🔥
      // Mongoose ডকুমেন্টকে সাধারণ অবজেক্টে পরিণত করা হচ্ছে যাতে ডেটা লস না হয়
      const safeCache = typeof cachedMovie.toObject === 'function' ? cachedMovie.toObject() : cachedMovie;
      const finalData = safeCache.details ? safeCache : (safeCache.data || safeCache);

      return res.json({
        success: true,
        data: { ...finalData, cached: true }
      });
    }

    // 🎬 TMDB DATA
    const movie = await tmdbService.getMovieDetails(movieId, lang);
    if (!movie) throw new Error("TMDB details failed");
    
    const formattedMovie = transformMovie(movie);

    // 🪪 Certification
    const releaseDates = await tmdbService.getReleaseDates(movieId);
    const indiaRelease = releaseDates?.results?.find(
      (r) => r.iso_3166_1 === "IN"
    );

    const cert =
      indiaRelease?.release_dates?.[0]?.certification || "UA 13+";

    // 🤖 AI + 📺 MEDIA + 📡 OTT
    const [aiAnalysisRaw, mediaRaw, watchProvidersRaw] =
      await Promise.all([
        getDetailedAiAnalysis(
          `${movie.title} ${movie.release_date}`,
          lang
        ).catch(() => ({})),

        youtubeService
          .getMovieMedia(movie.title, lang)
          .catch(() => ({})),

        tmdbService.getWatchProviders(movieId).catch(() => ({}))
      ]);

    // 🔥 SAFE AI
    const aiAnalysis = aiAnalysisRaw || {};

    const media = {
      trailerId: mediaRaw?.trailerId || "",
      playlist: mediaRaw?.playlist || []
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
      details: formattedMovie,
      aiAnalysis,
      trailerId: media.trailerId,
      playlist: media.playlist,
      watchProviders: watchProvidersRaw || {},
      meta,
      lastUpdated: new Date()
    };

    // 💾 CACHE SAVE (non-blocking)
    mongoCache.set(movieData);

    return res.json({
      success: true,
      data: { ...movieData, cached: false }
    });

  } catch (error) {
    console.error("Movie API Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch movie"
    });
  }
});

module.exports = router;
