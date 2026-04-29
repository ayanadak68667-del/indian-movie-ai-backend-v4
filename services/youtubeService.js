const axios = require("axios");

const BASE_URL = "https://www.googleapis.com/youtube/v3/search";
const API_KEY = process.env.YOUTUBE_API_KEY;

const langMap = {
  hi: "Hindi",
  bn: "Bengali",
  en: "Indian"
};

const fetchWithRetry = async (config, retries = 2) => {
  try {
    return await axios({ ...config, timeout: 8000 });
  } catch (err) {
    if (retries > 0) {
      console.warn(`🔁 YouTube Retry (${retries})`);
      return fetchWithRetry(config, retries - 1);
    }
    throw err;
  }
};

// 🔥 এখানে year প্যারামিটার যোগ করা হয়েছে
const getMovieMedia = async (movieTitle, lang = "en", year = "") => {
  try {
    if (!movieTitle) return { trailerId: "", playlist: [] };

    const langSuffix = langMap[lang] || "Indian";
    const yearText = year ? ` ${year}` : ""; // রিলিজ ইয়ার যোগ করা হলো

    // 🎯 একদম স্পেসিফিক সার্চ কোয়েরি
    const trailerQuery = `${movieTitle}${yearText} ${langSuffix} movie official trailer`;
    const songsQuery = `${movieTitle}${yearText} ${langSuffix} movie official video song`;

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

    const trailerId = trailerRes.data?.items?.[0]?.id?.videoId || "";
    const playlist = (songsRes.data?.items || []).map((item) => ({
      id: item.id?.videoId || "",
      title: item.snippet?.title || "",
      thumbnail: item.snippet?.thumbnails?.high?.url || ""
    }));

    return { trailerId, playlist };
  } catch (error) {
    console.error("❌ YouTube Service Error:", error.message);
    return { trailerId: "", playlist: [] };
  }
};

module.exports = { getMovieMedia };
