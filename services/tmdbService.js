const axios = require("axios");

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

// ✅ Axios instance (clean + reusable)
const api = axios.create({
  baseURL: TMDB_BASE,
  timeout: 10000,
  params: {
    api_key: API_KEY
  }
});

/**
 * 🔐 Safe TMDB request with retry + rate-limit handling
 */
async function safeGet(url, params = {}, retries = 2) {
  try {
    const res = await api.get(url, { params });
    return res.data;
  } catch (e) {
    const status = e?.response?.status;

    // 🔁 Retry for network / server errors
    if (retries > 0 && (!status || status >= 500)) {
      console.warn(`🔁 Retrying TMDB... (${retries})`);
      return safeGet(url, params, retries - 1);
    }

    // 🚦 Handle rate limit (429)
    if (status === 429 && retries > 0) {
      console.warn("⏳ TMDB rate limited, retrying...");
      await new Promise((r) => setTimeout(r, 1000));
      return safeGet(url, params, retries - 1);
    }

    console.error("❌ TMDB ERROR:", {
      url,
      params,
      status,
      message: e?.message
    });

    return null;
  }
}

/**
 * 🌐 App language → TMDB language
 */
function mapLang(lang = "en") {
  const langMap = {
    hi: "hi-IN",
    bn: "bn-IN",
    en: "en-US"
  };

  return langMap[lang] || "en-US";
}

class TMDBService {

  /* =========================
     🔥 HOMEPAGE APIs
     ========================= */

  async getTrending(lang = "en") {
    return safeGet("/discover/movie", {
      region: "IN",
      with_origin_country: "IN",
      sort_by: "popularity.desc",
      language: mapLang(lang)
    });
  }

  async getTopRated(lang = "en") {
    return safeGet("/movie/top_rated", {
      region: "IN",
      language: mapLang(lang)
    });
  }

  async getUpcoming(lang = "en") {
    return safeGet("/movie/upcoming", {
      region: "IN",
      language: mapLang(lang)
    });
  }

  async getPopularWebSeries(lang = "en") {
    return safeGet("/tv/popular", {
      language: mapLang(lang)
    });
  }

  /* =========================
     🎯 DISCOVER / MOOD
     ========================= */

  async discoverMovies({ genre, year, lang = "en" }) {
    return safeGet("/discover/movie", {
      with_genres: genre || undefined,
      primary_release_year: year || undefined,
      sort_by: "popularity.desc",
      region: "IN",
      language: mapLang(lang)
    });
  }

  /* =========================
     🔍 SEARCH
     ========================= */

  async searchMulti(query, lang = "en") {
    if (!query) return { results: [] };

    const [movieRes, tvRes] = await Promise.all([
      safeGet("/search/movie", {
        query,
        language: mapLang(lang),
        region: "IN"
      }),
      safeGet("/search/tv", {
        query,
        language: mapLang(lang)
      })
    ]);

    const movies = (movieRes?.results || []).map((m) => ({
      ...m,
      media_type: "movie"
    }));

    const tv = (tvRes?.results || []).map((t) => ({
      ...t,
      media_type: "tv"
    }));

    return {
      results: [...movies, ...tv].slice(0, 20)
    };
  }

  /* =========================
     🎬 MOVIE DETAILS
     ========================= */

  async getMovieDetails(movieId, lang = "en") {
    if (!movieId || isNaN(movieId)) return null;

    return safeGet(`/movie/${movieId}`, {
      append_to_response: "credits,videos,images",
      language: mapLang(lang)
    });
  }

  async getReleaseDates(movieId) {
    if (!movieId) return null;
    return safeGet(`/movie/${movieId}/release_dates`);
  }

  async getWatchProviders(movieId) {
    if (!movieId) return {};

    const data = await safeGet(`/movie/${movieId}/watch/providers`);
    return data?.results?.IN || {};
  }
}

module.exports = new TMDBService();
