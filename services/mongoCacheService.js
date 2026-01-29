const Movie = require('../models/Movie');

// ক্যাশ থেকে ডেটা আনা
const get = async (key) => {
  try {
    return await Movie.findOne({ tmdbId: key }).lean();
  } catch (e) {
    console.error("MongoCache GET error:", e.message);
    return null;
  }
};

// ক্যাশে ডেটা সেভ/আপডেট (upsert)
const set = async (data) => {
  try {
    return await Movie.findOneAndUpdate(
      { tmdbId: data.tmdbId },
      data,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (e) {
    console.error("MongoCache SET error:", e.message);
    return null;
  }
};

module.exports = { get, set };
