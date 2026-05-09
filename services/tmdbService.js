class TMDBService {

  /* =========================
     🔥 HOMEPAGE APIs (100% Indian Content Filtered)
     ========================= */

  async getTrending(lang = "en") {
    return safeGet("/discover/movie", {
      with_origin_country: "IN", // শুধু ইন্ডিয়ান
      sort_by: "popularity.desc",
      language: mapLang(lang)
    });
  }

  async getTopRated(lang = "en") {
    // 🔥 গ্লোবাল top_rated এর বদলে discover ব্যবহার করা হলো যাতে হলিউড না আসে
    return safeGet("/discover/movie", {
      with_origin_country: "IN",
      sort_by: "vote_average.desc",
      "vote_count.gte": 150, // অন্তত ১৫০ জন ভোট দিয়েছে এমন ভালো মুভি
      language: mapLang(lang)
    });
  }

  async getUpcoming(lang = "en") {
    const today = new Date().toISOString().split('T')[0];
    // 🔥 গ্লোবাল upcoming এর বদলে discover ব্যবহার করা হলো
    return safeGet("/discover/movie", {
      with_origin_country: "IN",
      "primary_release_date.gte": today, // আজকের পরের রিলিজ
      sort_by: "popularity.desc",
      language: mapLang(lang)
    });
  }

  async getPopularWebSeries(lang = "en") {
    // 🔥 tv/popular এর বদলে discover/tv ব্যবহার করা হলো
    return safeGet("/discover/tv", {
      with_origin_country: "IN",
      sort_by: "popularity.desc",
      language: mapLang(lang)
    });
  }

  /* =========================
     🎯 DISCOVER / MOOD (Hollywood Fixed!)
     ========================= */

  async discoverMovies({ genre, year, lang = "en" }) {
    return safeGet("/discover/movie", {
      with_genres: genre || undefined,
      primary_release_year: year || undefined,
      sort_by: "popularity.desc",
      with_origin_country: "IN", // 🚨 এই লাইনটাই হলিউড মুভিগুলোকে আটকে দেবে!
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

  /* =========================
     🌟 ACTOR / PERSON DETAILS
     ========================= */

  // অ্যাক্টরের বায়োগ্রাফি ও বেসিক ডিটেইলস আনার জন্য
  async getPersonDetails(personId, lang = "en") {
    if (!personId || isNaN(personId)) return null;
    return safeGet(`/person/${personId}`, {
      language: mapLang(lang)
    });
  }

  // অ্যাক্টরের সমস্ত মুভি ও সিরিজের লিস্ট আনার জন্য
  async getPersonCredits(personId, lang = "en") {
    if (!personId || isNaN(personId)) return null;
    return safeGet(`/person/${personId}/combined_credits`, {
      language: mapLang(lang)
    });
  }
}
