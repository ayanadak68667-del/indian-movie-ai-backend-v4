const axios = require("axios");

const BASE_URL = "https://www.googleapis.com/youtube/v3/search";
const API_KEY = process.env.YOUTUBE_API_KEY;

// 🌐 Language map
const langMap = {
  hi: "Hindi",
  bn: "Bengali",
  en: "English"
};

// 🔁 Retry wrapper
const fetchWithRetry = async (config, retries = 2) => {
  try {
    return await axios({
      ...config,
      timeout: 8000 // ⏱️ timeout added
    });
  } catch (err) {
    if (retries > 0) {
      console.warn(`🔁 YouTube Retry (${retries})`);
      return fetchWithRetry(config, retries - 1);
    }
    throw err;
  }
};

const getMovieMedia = async (movieTitle, lang = "en") => {
  try {
    if (!movieTitle) {
      return { trailerId: "", playlist: [] };
    }

    const langSuffix = langMap[lang] || "English";

    // 🎯 Better query (accuracy improved)
    const trailerQuery = `${movieTitle} official trailer ${langSuffix}`;
    const songsQuery = `${movieTitle} movie songs ${langSuffix}`;

    // ⚡ Parallel requests
    const [trailerRes, songsRes] = await Promise.all([
      fetchWithRetry({
        url: BASE_URL,
        method: "GET",
        params: {
          part: "snippet",
          q: trailerQuery,
          maxResults: 1,
          key: API_KEY,
          type: "video",
          videoCategoryId: "1", // 🎬 Film category
          order: "relevance"
        }
      }),

      fetchWithRetry({
        url: BASE_URL,
        method: "GET",
        params: {
          part: "snippet",
          q: songsQuery,
          maxResults: 4,
          key: API_KEY,
          type: "video",
          order: "relevance"
        }
      })
    ]);

    // 🎬 Trailer
    const trailerId =
      trailerRes.data?.items?.[0]?.id?.videoId || "";

    // 🎵 Playlist
    const playlist = (songsRes.data?.items || []).map((item) => ({
      id: item.id?.videoId || "",
      title: item.snippet?.title || "",
      thumbnail: item.snippet?.thumbnails?.high?.url || ""
    }));

    return { trailerId, playlist };

  } catch (error) {
    console.error("❌ YouTube Service Error:", {
      movieTitle,
      lang,
      message: error.message
    });

    return { trailerId: "", playlist: [] };
  }
};

module.exports = { getMovieMedia };
