
const HomeCache = require("../models/HomeCache");

// ⏱️ 24 HOURS TTL
const HOME_CACHE_TTL = 1000 * 60 * 60 * 24;

const homeCacheService = {

  // 🔍 GET cache (FAST + SAFE)
  async get(key) {
    try {
      const cacheDoc = await HomeCache.findOne({ key }).lean();

      if (!cacheDoc) return null;

      const age =
        Date.now() - new Date(cacheDoc.lastUpdated).getTime();

      // ❌ Expired (NO BLOCKING DELETE)
      if (age > HOME_CACHE_TTL) {
        // 🔥 async cleanup (non-blocking)
        HomeCache.deleteOne({ key }).catch(() => {});
        return null;
      }

      return cacheDoc.data;

    } catch (err) {
      console.error("HomeCache GET Error:", err.message);
      return null;
    }
  },

  // 💾 SET cache (SAFE UPSERT)
  async set(key, data) {
    try {
      await HomeCache.findOneAndUpdate(
        { key },
        {
          data,
          lastUpdated: new Date()
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
    } catch (err) {
      console.error("HomeCache SET Error:", err.message);
    }
  },

  // 🧹 CLEAR
  async clear(key) {
    try {
      await HomeCache.deleteOne({ key });
    } catch (err) {
      console.error("HomeCache CLEAR Error:", err.message);
    }
  }
};

module.exports = homeCacheService;
