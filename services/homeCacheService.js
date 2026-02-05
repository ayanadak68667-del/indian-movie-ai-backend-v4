const HomeCache = require("../models/HomeCache");

// ⏱️ 24 HOURS TTL (Home related data)
const HOME_CACHE_TTL = 1000 * 60 * 60 * 24;

const homeCacheService = {

  // 🔍 GET cache
  async get(key) {
    try {
      const cacheDoc = await HomeCache.findOne({ key });

      if (!cacheDoc) return null;

      const age = Date.now() - new Date(cacheDoc.lastUpdated).getTime();

      // ❌ Expired
      if (age > HOME_CACHE_TTL) {
        await HomeCache.deleteOne({ key });
        return null;
      }

      // ✅ Valid cache
      return cacheDoc.data;

    } catch (err) {
      console.error("HomeCache GET Error:", err.message);
      return null;
    }
  },

  // 💾 SET cache
  async set(key, data) {
    try {
      await HomeCache.findOneAndUpdate(
        { key },
        {
          data,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error("HomeCache SET Error:", err.message);
    }
  },

  // 🧹 Optional manual clear
  async clear(key) {
    try {
      await HomeCache.deleteOne({ key });
    } catch (err) {
      console.error("HomeCache CLEAR Error:", err.message);
    }
  }
};

module.exports = homeCacheService;
