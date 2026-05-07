const Groq = require("groq-sdk");
const { tavily } = require("@tavily/core");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

// ✅ Default safe response (UI-এর সাথে হুবহু মেলানো হয়েছে)
const defaultResponse = {
  summary: "AI analysis is currently unavailable for this movie.",
  ai_verdict: "N/A",
  data_deep_dive: {
    budget: "N/A",
    box_office: "N/A",
    verdict: "N/A",
    indian_roi: "N/A",
    global_roi: "N/A"
  },
  who_should_watch: {
    mass_audience: 0,
    family: 0,    // 🔥 ফ্রন্টএন্ডের সাথে মেলানো হলো
    kids: 0       // 🔥 ফ্রন্টএন্ডের critics & cinephiles-এর জন্য
  },
  performance_spotlight: [],
  star_paychecks: [],
  hits: [],
  misses: [],
  bts: []
};

// ✅ Safe JSON parse
const safeParse = (text) => {
  try {
    const parsed = JSON.parse(text);
    // Safety check: Ensure the returned keys match what frontend expects
    if (!parsed.who_should_watch) {
      parsed.who_should_watch = defaultResponse.who_should_watch;
    }
    return parsed;
  } catch (e) {
    console.error("JSON Parse Error:", e.message);
    return defaultResponse;
  }
};

exports.getDetailedAiAnalysis = async (movieTitle, lang = "en") => {
  const langMap = {
    hi: "Hindi",
    bn: "Bengali",
    en: "English"
  };

  const languageText = langMap[lang] || "English";

  const model =
    lang === "en"
      ? "llama-3.1-8b-instant"
      : "llama-3.3-70b-versatile";

  try {
    // 🌐 ---------------------------------------------------------
    // Tavily দিয়ে লাইভ ইন্টারনেট সার্চ (বক্স অফিস ও বাজেটের জন্য)
    // ---------------------------------------------------------
    let liveInternetData = "No live data found.";
    try {
      console.log(`🔍 Tavily Searching live internet for: ${movieTitle}`);
      // 🎯 FIXED: Forced Tavily to look for Indian currency (Crores/INR)
      const tavilyResponse = await tvly.search(
        `${movieTitle} Indian movie exact budget in Crores INR, worldwide box office collection in Crores INR, star cast salary fees, OTT platform release`,
        { 
          searchDepth: "basic", 
          includeAnswer: true,
          maxResults: 3 
        }
      );
      liveInternetData = tavilyResponse.answer || "No live data found.";
    } catch (tavilyError) {
      console.warn("⚠️ Tavily Search Failed:", tavilyError.message);
    }

    // 🎯 The Magic Prompt for your Dream Design (Updated for strictness and exact keys)
    const prompt = `Movie: "${movieTitle}". You are a top Indian movie critic and AI analyst for "Filmi Bharat".
    
    [CRITICAL LIVE DATA]: Here is the absolute latest information about this movie directly from the internet right now: "${liveInternetData}"
    
    Based ONLY on this live data and your existing knowledge, generate a DETAILED, CINEMATIC analysis in ${languageText}. 
    
    CRITICAL RULES:
    1. NEVER use Dollar ($) signs. Convert all financial figures to Indian Rupees (₹) and format them in "Crores" (e.g., "₹20 Crore").
    2. If the movie had a direct OTT release and no box office exists, clearly state "OTT Release" for verdict and "N/A" for box office.
    3. If data is genuinely missing from the LIVE DATA or your knowledge, use "N/A" rather than inventing numbers.
    4. Provide actual actor names in performance_spotlight and star_paychecks.
    5. The "who_should_watch" object MUST use EXACTLY these keys: "mass_audience", "family", and "kids" (note: "kids" represents critics/cinephiles). Provide integer values from 0 to 100.
    
    Return ONLY valid JSON matching this EXACT structure, nothing else:
    {
      "summary": "1-2 lines big cinematic summary",
      "ai_verdict": "One short phrase verdict (e.g., Cinematic Masterpiece, Blockbuster, Average, Disaster)",
      "data_deep_dive": {
        "budget": "₹X Crore",
        "box_office": "₹Y Crore",
        "verdict": "Blockbuster / Hit / Flop / OTT Release",
        "indian_roi": "X%",
        "global_roi": "Y%"
      },
      "who_should_watch": {
        "mass_audience": 90,
        "family": 80,
        "kids": 70
      },
      "performance_spotlight": [
        {
          "actor": "Actor Name",
          "role": "Character Name",
          "review": "Short review of their performance"
        }
      ],
      "star_paychecks": [
        {
          "actor": "Actor Name",
          "character": "Character Name",
          "salary": "₹X Crore"
        }
      ],
      "hits": ["Strength 1", "Strength 2"],
      "misses": ["Weakness 1", "Weakness 2"],
      "bts": ["Behind the scenes fact 1", "Behind the scenes fact 2"]
    }`;

    let attempts = 0;

    while (attempts < 2) {
      try {
        const response = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model,
          response_format: { type: "json_object" }
        });

        const raw = response.choices?.[0]?.message?.content || "{}";
        return safeParse(raw);
      } catch (err) {
        attempts++;
        console.warn(`🔁 AI Retry (${attempts})`);

        if (attempts >= 2) throw err;
      }
    }

    return defaultResponse;

  } catch (error) {
    console.error("❌ Groq Error:", error.message);
    return defaultResponse;
  }
};
