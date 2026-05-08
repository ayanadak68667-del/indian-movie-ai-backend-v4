const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const youtubeService = require("../services/youtubeService");
const groqService = require("../services/groqService"); 
const mongoCache = require("../services/mongoCacheService");
const ottService = require("../services/ottService"); 

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

// ৩️⃣ SEARCH (🔥 Junk Filter Added - ফালতু ভিডিও আর আসবে না)
router.get("/search", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();
    const lang = req.query.lang || "en";
    const page = req.query.page || 1;

    if (query.length < 2) return res.json({ success: true, data: [] });

    const data = await tmdbService.searchMulti(query, lang, page);
    
    // 🔥 ম্যাজিক ফিল্টার: শুধুমাত্র আসল ও জনপ্রিয় মুভি/সিরিজগুলো ফিল্টার করা হচ্ছে
    const validResults = (data?.results || []).filter(item => {
      const isMedia = item.media_type === 'movie' || item.media_type === 'tv';
      const hasPoster = !!item.poster_path;
      const isPopularEnough = (item.vote_count || 0) >= 5;
      return isMedia && hasPoster && isPopularEnough;
    });

    const formattedData = validResults.map(transformMovie);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(500).json({ success: false, data: [] });
  }
});

// ৪️⃣ MOVIE DETAILS (🔥 Smart Certificate Fix Added)
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

    // 🔥 স্মার্ট সার্টিফিকেট লজিক (ভারত -> আমেরিকা -> ডিফল্ট)
    const releaseDates = await tmdbService.getReleaseDates(movieId);
    let cert = "UA"; // ডিফল্ট 'N/A' এর বদলে 'UA'
    if (releaseDates && releaseDates.results) {
      const targetRelease = 
        releaseDates.results.find((r) => r.iso_3166_1 === "IN") || 
        releaseDates.results.find((r) => r.iso_3166_1 === "US") || 
        releaseDates.results[0];

      if (targetRelease && targetRelease.release_dates) {
        const validCert = targetRelease.release_dates.find(d => d.certification && d.certification.trim() !== "");
        if (validCert) {
          cert = validCert.certification;
        }
      }
    }

    const [aiAnalysisRaw, mediaRaw, watchProvidersRaw] = await Promise.all([
      groqService.getDetailedAiAnalysis(`${movie.title} ${movie.release_date}`, lang).catch(() => ({})),
      youtubeService.getMovieMedia(movie.title, lang, releaseYear).catch(() => ({})), 
      ottService.getStreamingInfo(movie.title).catch(() => ({ flatrate: [] })) 
    ]);

    const aiAnalysis = aiAnalysisRaw || {};

    const tmdbCrew = movie.credits?.crew || [];
    const director = tmdbCrew.find(c => c.job === "Director")?.name || "Not Available";
    const producer = tmdbCrew.find(c => c.job === "Producer" || c.job === "Executive Producer")?.name || "Not Available";
    const music = tmdbCrew.find(c => c.job === "Original Music Composer" || c.job === "Music")?.name || "Not Available";

    aiAnalysis.crew = { director, producer, music };

    const media = {
      trailerId: mediaRaw?.trailerId || "",
      playlist: mediaRaw?.playlist || []
    };

    const meta = {
      isTrending: (movie.popularity || 0) > 100,
      isNew: movie.release_date ? (Date.now() - new Date(movie.release_date)) / 86400000 < 60 : false,
      popularity: movie.popularity || 0,
      imdbRating: movie.vote_average || 0,
      certification: cert // 🔥 ফিক্সড সার্টিফিকেট এখানে অ্যাড হলো
    };

    const movieData = {
      tmdbId: cacheKey,
      details: formattedMovie,
      aiAnalysis,
      trailerId: media.trailerId,
      playlist: media.playlist,
      watchProviders: watchProvidersRaw,
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
