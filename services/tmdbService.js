const axios = require("axios");

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

// সব রিকোয়েস্টের জন্য কমন safe getter
async function safeGet(url, params = {}) {
  try {
    const res = await axios.get(url, {
      params: { api_key: API_KEY, ...params },
      timeout: 10000
    });
    return res.data;
  } catch (e) {
    console.error("TMDB ERROR:", url, e?.response?.status, e?.message);
    return null;
  }
}

// en / hi থেকে TMDB language বানানো
function mapLang(lang) {
  return lang === "hi" ? "hi-IN" : "en-US";
}

class TMDBService {

  // 🔥 ট্রেন্ডিং ইন্ডিয়ান মুভি
  async getTrending(lang = "en") {
    return await safeGet(`${TMDB_BASE}/discover/movie`, {
      region: "IN",
      with_origin_country: "IN",
      sort_by: "popularity.desc",
      language: mapLang(lang)
    });
  }

  // 🎯 জঁর + বছর দিয়ে ডিসকভার
  async discoverMovies({ genre, year, lang = "en" }) {
    return await safeGet(`${TMDB_BASE}/discover/movie`, {
      with_genres: genre || "",
      primary_release_year: year || "",
      sort_by: "popularity.desc",
      region: "IN",
      language: mapLang(lang)
    });
  }

  // 🔍 সার্চ (movie + tv মিক্স)
  async searchMulti(query, lang = "en") {
    const movieRes = await safeGet(`${TMDB_BASE}/search/movie`, {
      query,
      language: mapLang(lang),
      region: "IN"
    });

    const tvRes = await safeGet(`${TMDB_BASE}/search/tv`, {
      query,
      language: mapLang(lang)
    });

    const movies = (movieRes?.results || []).map(m => ({ ...m, media_type: "movie" }));
    const tv = (tvRes?.results || []).map(t => ({ ...t, media_type: "tv" }));

    return { results: [...movies, ...tv].slice(0, 20) };
  }

  // 🎬 মুভি ডিটেইলস + credits + videos
  async getMovieDetails(movieId, lang = "en") {
    return await safeGet(`${TMDB_BASE}/movie/${movieId}`, {
      append_to_response: "credits,videos",
      language: mapLang(lang)
    });
  }

  // 🪪 ভারতের সার্টিফিকেশন (U/A ইত্যাদি বের করার জন্য)
  async getReleaseDates(movieId) {
    return await safeGet(`${TMDB_BASE}/movie/${movieId}/release_dates`);
  }

  // 📺 কোথায় স্ট্রিম করা যাবে (OTT)
  async getWatchProviders(movieId) {
    const data = await safeGet(`${TMDB_BASE}/movie/${movieId}/watch/providers`);
    return data?.results?.IN || {};
  }

}

module.exports = new TMDBService();
