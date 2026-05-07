const Groq = require("groq-sdk");
const { tavily } = require("@tavily/core");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

// ✅ Default safe response
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
    family: 0,    
    kids: 0       
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
    if (!parsed.who_should_watch) {
      parsed.who_should_watch = defaultResponse.who_should_watch;
    }
    return parsed;
  } catch (e) {
    console.error("JSON Parse Error:", e.message);
    return defaultResponse;
  }
};

exports.getDetailedAiAnalysis = async (movieTitleWithDate, lang = "en") => {
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
    // Tavily Search (Optimized for exact movie match)
    // ---------------------------------------------------------
    let liveInternetData = "No live data found.";
    try {
      console.log(`🔍 Tavily Searching live internet for: ${movieTitleWithDate}`);
      
      // 🎯 FIXED: Search query is much smarter now to avoid sequel mix-ups
      const tavilyResponse = await tvly.search(
        `"${movieTitleWithDate}" Indian movie exact budget, worldwide box office collection, star cast salary. (Do not include sequels)`,
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

    // 🎯 The Magic Prompt: STRICT ACCURACY & ANTI-SEQUEL LOCK
    const prompt = `Movie Name & Release Date: "${movieTitleWithDate}". You are a highly professional Indian movie critic and AI data analyst for "Filmi Bharat". Accuracy is your #1 priority.
    
    [CRITICAL LIVE DATA]: "${liveInternetData}"
    
    Based on the live data and your training, generate a DETAILED, CINEMATIC analysis in ${languageText}.
    
    🚨 STRICT ACCURACY RULES (CRITICAL):
    1. ANTI-SEQUEL LOCK: You are analyzing the EXACT movie released on the date mentioned above. Do NOT mix it up with its sequels, prequels, or recent trending parts (e.g., If asked about "Stree 2018", absolutely DO NOT give data for "Stree 2 2024").
    2. VERIFY LIVE DATA: If the [CRITICAL LIVE DATA] provided is talking about a sequel or a different movie, completely IGNORE IT and rely on your own highly accurate historical data for the original movie.
    3. CURRENCY: NEVER use Dollar ($) signs. Convert all financial figures to Indian Rupees (₹) and format them in "Crores" (e.g., "₹20 Crore", "₹125 Crore").
    4. MISSING DATA: If the box office or salary data is genuinely unavailable, write "N/A". Do not invent numbers.
    5. The "who_should_watch" object MUST use EXACTLY these keys: "mass_audience", "family", and "kids".
    
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
