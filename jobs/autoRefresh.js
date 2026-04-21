 const cron = require("node-cron");
const tmdbService = require("../services/tmdbService");
const homeCache = require("../services/homeCacheService");
const { getDetailedAiAnalysis } = require("../services/groqService");
const mongoCache = require("../services/mongoCacheService");

// 🔥 Helper: safe async run
const safeRun = async (label, fn) => {
  try {
    console.log(`⏳ Running job: ${label}`);
    await fn();
    console.log(`✅ Done: ${label}`);
  } catch (err) {
    console.error(`❌ Error in ${label}:`, err.message);
  }
};

/* =========================
   🎬 TRENDING REFRESH (Every 10 min)
========================= */
cron.schedule("*/10 * * * *", () => {
  safeRun("Trending Refresh", async () => {
    const data = await tmdbService.getTrending();
    if (!data) return;

    await homeCache.set("home_trending", data.results || []);
  });
});

/* =========================
   🏠 HOMEPAGE REFRESH (Every 30 min)
========================= */
cron.schedule("*/30 * * * *", () => {
  safeRun("Homepage Refresh", async () => {
    const [trending, topRated, upcoming, webseries] = await Promise.all([
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

    await homeCache.set("home_default", data);
  });
});

/* =========================
   🤖 AI PRE-CACHE (Every 1 hour)
========================= */
cron.schedule("0 * * * *", () => {
  safeRun("AI Pre-cache", async () => {
    const trending = await tmdbService.getTrending();

    const movies = (trending?.results || []).slice(0, 5);

    for (const m of movies) {
      const key = `${m.id}_en`;

      const existing = await mongoCache.get(key);
      if (existing) continue; // skip if cached

      const ai = await getDetailedAiAnalysis(m.title, "en").catch(() => ({}));

      await mongoCache.set({
        tmdbId: key,
        details: {},
        aiAnalysis: ai,
        lastUpdated: new Date()
      });
    }
  });
});

console.log("🔥 Auto Refresh Jobs Started");
    // 💾 Save to cache
    await homeCache.set("home_default", data);

    console.log("✅ Homepage Auto Refreshed");

  } catch (err) {
    console.error("❌ Auto Refresh Error:", err.message);
  }
});
