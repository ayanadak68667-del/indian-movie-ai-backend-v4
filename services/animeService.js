const axios = require('axios');

const JIKAN_BASE = "https://api.jikan.moe/v4";

// ✅ Jikan API-এর জন্য আলাদা Axios Instance
const api = axios.create({
  baseURL: JIKAN_BASE,
  timeout: 10000,
});

class AnimeService {
  
  // ১. পপুলার বা ট্রেন্ডিং অ্যানিমে আনার জন্য
  async getTrendingAnime(page = 1) {
    try {
      const res = await api.get(`/top/anime?page=${page}&limit=20`);
      return res.data;
    } catch (error) {
      console.error("Jikan API Error (Trending):", error.message);
      return null;
    }
  }

  // ২. অ্যানিমে সার্চ করার জন্য
  async searchAnime(query, page = 1) {
    try {
      const res = await api.get(`/anime?q=${query}&page=${page}&limit=20`);
      return res.data;
    } catch (error) {
      console.error("Jikan API Error (Search):", error.message);
      return null;
    }
  }

  // ৩. নির্দিষ্ট কোনো অ্যানিমের ফুল ডিটেইলস আনার জন্য
  async getAnimeDetails(id) {
    try {
      const res = await api.get(`/anime/${id}/full`);
      return res.data;
    } catch (error) {
      console.error("Jikan API Error (Details):", error.message);
      return null;
    }
  }
}

module.exports = new AnimeService();
