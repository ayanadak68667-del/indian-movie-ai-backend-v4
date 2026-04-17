const cron = require("node-cron");
const tmdbService = require("../services/tmdbService");
const homeCache = require("../services/homeCacheService");

console.log("🧠 Auto Refresh System Started...");

// ⏰ Every 6 hours
cron.schedule("0 */6 * * *", async () => {
  console.log("🔄 Running Auto Refresh...");

  try {
    // 🔥 Fetch all homepage data
    const [trending, topRated, upcoming, webseries] =
      await Promise.all([
        tmdbService.getTrending(),
        tmdbService.getTopRated(),
        tmdbService.getUpcoming(),
        tmdbService.getPopularWebSeries()
      ]);

    const data = {
      heroPicks: (trending?.results || []).slice(0, 3),
      trending: (trending?.results || []).slice(3, 8),
      topRated: (topRated?.results || []).slice(0, 5),
      upcoming: (upcoming?.results || []).slice(0, 5),
      webSeries: (webseries?.results || []).slice(0, 5)
    };

    // 💾 Save to cache
    await homeCache.set("home_default", data);

    console.log("✅ Homepage Auto Refreshed");

  } catch (err) {
    console.error("❌ Auto Refresh Error:", err.message);
  }
});
