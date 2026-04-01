const axios = require("axios");

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

/**
 * 🔐 Safe TMDB request wrapper
 */
async function safeGet(url, params = {}) {
  try {
    const res = await axios.get(url, {
      params: { api_key: API_KEY, ...params },
      timeout: 10000
    });
    return res.data;
  } catch (e) {
    console.error(
      "TMDB ERROR:",
      url,
      e?.response?.status || "",
      e?.message || ""
    );
    return null;
  }
}

/**
 * 🌐 App language → TMDB language
 */
function mapLang(lang = "en") {
  return lang === "hi" ? "hi-IN" : "en-US";
}

class TMDBService {

  /* =========================
     🔥 HOMEPAGE APIs
     ========================= */

  // 🔥 Trending Indian Movies
  async getTrending(lang = "en") {
    return safeGet(`${TMDB_BASE}/discover/movie`, {
      region: "IN",
      with_origin_country: "IN",
      sort_by: "popularity.desc",
      language: mapLang(lang)
    });
  }

  // ⭐ Top Rated Movies (India)
  async getTopRated(lang = "en") {
    return safeGet(`${TMDB_BASE}/movie/top_rated`, {
      region: "IN",
      language: mapLang(lang)
    });
  }

  // ⏳ Upcoming Movies
  async getUpcoming(lang = "en") {
    return safeGet(`${TMDB_BASE}/movie/upcoming`, {
      region: "IN",
      language: mapLang(lang)
    });
  }

  // 📺 Popular Web Series
  async getPopularWebSeries(lang = "en") {
    return safeGet(`${TMDB_BASE}/tv/popular`, {
      language: mapLang(lang)
    });
  }

  /* =========================
     🎯 DISCOVER / MOOD
     ========================= */

  // 🎯 Discover Movies (Genre / Year / Mood)
  async discoverMovies({ genre, year, lang = "en" }) {
    return safeGet(`${TMDB_BASE}/discover/movie`, {
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

  // 🔍 Search Movies + TV
  async searchMulti(query, lang = "en") {
    if (!query) return { results: [] };

    const [movieRes, tvRes] = await Promise.all([
      safeGet(`${TMDB_BASE}/search/movie`, {
        query,
        language: mapLang(lang),
        region: "IN"
      }),
      safeGet(`${TMDB_BASE}/search/tv`, {
        query,
        language: mapLang(lang)
      })
    ]);

    const movies = (movieRes?.results || []).map(m => ({
      ...m,
      media_type: "movie"
    }));

    const tv = (tvRes?.results || []).map(t => ({
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

  // 🎬 Movie Details + Credits + Videos
  async getMovieDetails(movieId, lang = "en") {
    return safeGet(`${TMDB_BASE}/movie/${movieId}`, {
      append_to_response: "credits,videos,images",
      language: mapLang(lang)
    });
  }

  // 🪪 Indian Certification
  async getReleaseDates(movieId) {
    return safeGet(`${TMDB_BASE}/movie/${movieId}/release_dates`);
  }

  // 📺 OTT / Watch Providers (India)
  async getWatchProviders(movieId) {
    const data = await safeGet(
      `${TMDB_BASE}/movie/${movieId}/watch/providers`
    );
    return data?.results?.IN || {};
  }
}

module.exports = new TMDBService();
