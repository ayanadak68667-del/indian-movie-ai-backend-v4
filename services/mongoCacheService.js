const Movie = require("../models/Movie");

// ⏳ Cache TTL (24 hours)
const CACHE_TTL = 1000 * 60 * 60 * 24;

// ✅ Check if cache expired
const isExpired = (doc) => {
  if (!doc?.lastUpdated) return true;
  return Date.now() - new Date(doc.lastUpdated).getTime() > CACHE_TTL;
};

// 🔍 GET cache (with expiry check)
const get = async (key) => {
  try {
    if (!key) return null;

    const doc = await Movie.findOne({ tmdbId: key }).lean();

    if (!doc) return null;

    // ❌ expired হলে return null
    if (isExpired(doc)) {
      return null;
    }

    return doc;
  } catch (e) {
    console.error("❌ MongoCache GET error:", e.message);
    return null;
  }
};

// 💾 SET cache (non-blocking write)
const set = async (data) => {
  try {
    if (!data || !data.tmdbId) return null;

    // async write (🔥 performance boost)
    Movie.findOneAndUpdate(
      { tmdbId: data.tmdbId },
      {
        ...data,
        lastUpdated: new Date()
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    ).catch((err) =>
      console.error("❌ MongoCache SET error:", err.message)
    );

    return true;
  } catch (e) {
    console.error("❌ MongoCache SET error:", e.message);
    return null;
  }
};

module.exports = { get, set };
