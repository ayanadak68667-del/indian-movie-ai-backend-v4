const HomeCache = require("../models/HomeCache");

const HOME_TTL = 1000 * 60 * 60 * 24; // 24 hours

const get = async (key) => {
  const cache = await HomeCache.findOne({ key }).lean();
  if (!cache) return null;

  const isExpired =
    Date.now() - new Date(cache.lastUpdated).getTime() > HOME_TTL;

  if (isExpired) return null;
  return cache.data;
};

const set = async (key, data) => {
  await HomeCache.findOneAndUpdate(
    { key },
    {
      key,
      data,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
};

module.exports = { get, set };
