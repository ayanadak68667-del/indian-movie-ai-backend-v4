const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const youtubeService = require("../services/youtubeService");
const { getDetailedAiAnalysis } = require("../services/groqService");
const mongoCache = require("../services/mongoCacheService");
const ottService = require("../services/ottService"); // 🔥 OTT সার্ভিস

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
    const page = req.query.page || 1; 
    const data = await tmdbService.getTrending(lang, page);
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
    const { genre, year, lang = "en", page = 1 } = req.query;
    const data = await tmdbService.discoverMovies({ genre, year, lang, page });
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
    const page = req.query.page || 1;

    if (query.length < 2) return res.json({ success: true, data: [] });

    const data = await tmdbService.searchMulti(query, lang, page);
    const formattedData = (data?.results || []).map(transformMovie);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(500).json({ success: false, data: [] });
  }
});

// ৪️⃣ MOVIE DETAILS (🔥 Final Updated)
router.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;
  const lang = req.query.lang || "en";

  if (!movieId || isNaN(movieId)) {
    return res.status(400).json({ success: false, message: "Invalid movie ID" });
  }

  const cacheKey = `${movieId}_${lang}`;

  try {
    const cachedMovie = await mongoCache.get(cacheKey);

    if (cachedMovie) {
      const safeCache = typeof cachedMovie.toObject === 'function' ? cachedMovie.toObject() : cachedMovie;
      const finalData = safeCache.details ? safeCache : (safeCache.data || safeCache);
      return res.json({ success: true, data: { ...finalData, cached: true } });
    }

    const movie = await tmdbService.getMovieDetails(movieId, lang);
    if (!movie) throw new Error("TMDB details failed");
    
    const formattedMovie = transformMovie(movie);
    const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : ""; 

    const releaseDates = await tmdbService.getReleaseDates(movieId);
    const indiaRelease = releaseDates?.results?.find((r) => r.iso_3166_1 === "IN");
    const cert = indiaRelease?.release_dates?.[0]?.certification || "UA 13+";

    // 🚀 Promise.all (OTT API যোগ করা হয়েছে)
    const [aiAnalysisRaw, mediaRaw, watchProvidersRaw] = await Promise.all([
      getDetailedAiAnalysis(`${movie.title} ${movie.release_date}`, lang).catch(() => ({})),
      youtubeService.getMovieMedia(movie.title, lang, releaseYear).catch(() => ({})), 
      ottService.getStreamingInfo(movie.title).catch(() => ({ flatrate: [] })) 
    ]);

    const aiAnalysis = aiAnalysisRaw || {};

    // 🎯 ম্যাজিক ট্রিক: TMDB থেকে ১০০% নির্ভুল Crew ডেটা বের করা হচ্ছে
    const tmdbCrew = movie.credits?.crew || [];
    const director = tmdbCrew.find(c => c.job === "Director")?.name || "Not Available";
    const producer = tmdbCrew.find(c => c.job === "Producer" || c.job === "Executive Producer")?.name || "Not Available";
    const music = tmdbCrew.find(c => c.job === "Original Music Composer" || c.job === "Music")?.name || "Not Available";

    // 🎯 AI-এর ডেটাতে TMDB-এর Crew ডেটা ঢুকিয়ে দেওয়া হলো
    aiAnalysis.crew = {
      director: director,
      producer: producer,
      music: music
    };

    const media = {
      trailerId: mediaRaw?.trailerId || "",
      playlist: mediaRaw?.playlist || []
    };

    // 🚀 স্ট্রিমিং ডেটা (RapidAPI থেকে)
    const safeWatchProviders = watchProvidersRaw;

    const meta = {
      isTrending: (movie.popularity || 0) > 100,
      isNew: movie.release_date ? (Date.now() - new Date(movie.release_date)) / 86400000 < 60 : false,
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
      watchProviders: safeWatchProviders,
      meta,
      lastUpdated: new Date()
    };

    mongoCache.set(movieData);

    return res.json({ success: true, data: { ...movieData, cached: false } });

  } catch (error) {
    console.error("Movie API Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch movie" });
  }
});

module.exports = router;
