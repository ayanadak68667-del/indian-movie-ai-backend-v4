const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

/**
 * ১. সার্চ মুভি (ইউজারের মেসেজ থেকে মুভি আইডি খুঁজে বের করা)
 */
async function searchMovie(query) {
  try {
    // ইউজারের মেসেজ থেকে মুভির নাম আলাদা করার চেষ্টা (Basic cleanup)
    const response = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        include_adult: false,
        language: 'en-US',
        page: 1,
      },
    });

    // প্রথম রেজাল্টটি রিটার্ন করা হচ্ছে
    return response.data.results?.[0] || null;
  } catch (error) {
    console.error("TMDB Search Error:", error.message);
    return null;
  }
}

/**
 * ২. গেট মুভি ডিটেইলস (ক্রেডিট সহ ফুল ডিটেইলস)
 */
async function getMovieDetails(tmdbId) {
  try {
    const response = await axios.get(`${BASE_URL}/movie/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        append_to_response: 'credits', // কাস্ট ডিটেইলস পাওয়ার জন্য
      },
    });
    return response.data;
  } catch (error) {
    console.error("TMDB Details Error:", error.message);
    return null;
  }
}

module.exports = {
  searchMovie,
  getMovieDetails,
  // আপনার আগের তৈরি করা getMoviesByGenre ও এখানে রাখতে পারেন
};
