const cron = require("node-cron");
const tmdbService = require("../services/tmdbService");
const homeCache = require("../services/homeCacheService");
const { getDetailedAiAnalysis } = require("../services/groqService");
const mongoCache = require("../services/mongoCacheService");

// 📊 API Usage Controls
let aiCallsToday = 0;
let lastResetDate = new Date().toDateString();
const MAX_AI_CALLS_PER_DAY = 20;

// 🔒 Safe runner
const safeRun = async (label, fn) => {
  try {
    console.log(`⏳ Running job: ${label}`);
    await fn();
    console.log(`✅ Done: ${label}`);
  } catch (err) {
    console.error(`❌ Error in ${label}:`, err.message);
  }
};

// 🔁 Auto reset (if server didn't restart)
const checkAndResetCounter = () => {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    aiCallsToday = 0;
    lastResetDate = today;
    console.log("📅 AI Call counter auto-reset.");
  }
};

/* ==========================================
   🎬 TRENDING REFRESH (Every 30 min)
   ========================================== */
cron.schedule("*/30 * * * *", () => {
  safeRun("Trending Refresh", async () => {
    const data = await tmdbService.getTrending();
    if (!data?.results?.length) return;

    await homeCache.set("home_trending", data.results);
  });
});

/* ==========================================
   🤖 AI PRE-CACHE (Every 1 hour)
   ========================================== */
cron.schedule("0 * * * *", () => {
  safeRun("AI Pre-cache", async () => {
    checkAndResetCounter();

    // 🔒 Daily limit check
    if (aiCallsToday >= MAX_AI_CALLS_PER_DAY) {
      console.log("⚠️ Daily AI limit reached. Skipping.");
      return;
    }

    const trending = await tmdbService.getTrending();
    if (!trending?.results?.length) return;

    const movies = trending.results.slice(0, 2); // limit 2 movies

    for (const m of movies) {
      if (aiCallsToday >= MAX_AI_CALLS_PER_DAY) break;

      const key = `${m.id}_en`;
      const existing = await mongoCache.get(key);

      // 🔍 Skip if already has AI data
      if (existing?.aiAnalysis?.summary) continue;

      const ai = await getDetailedAiAnalysis(m.title, "en").catch(() => null);

      if (!ai) continue;

      await mongoCache.set({
        tmdbId: key,
        details: {}, // ✅ REQUIRED FIELD FIX
        aiAnalysis: ai,
        lastUpdated: new Date()
      });

      aiCallsToday++;

      console.log(
        `🤖 Cached: ${m.title} (${aiCallsToday}/${MAX_AI_CALLS_PER_DAY})`
      );
    }
  });
});

/* ==========================================
   🌙 HARD RESET (Midnight)
   ========================================== */
cron.schedule("0 0 * * *", () => {
  aiCallsToday = 0;
  lastResetDate = new Date().toDateString();
  console.log("🌙 Midnight reset: AI counter cleared.");
});

console.log("🚀 Auto Refresh Jobs Started (Optimized Mode)");
