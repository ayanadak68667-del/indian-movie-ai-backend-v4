const Groq = require("groq-sdk");
const { tavily } = require("@tavily/core"); // 🔥 'tvly' এর বদলে 'tavily' হবে

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY }); // 🔥 এখানে অবজেক্ট আকারে API কী দিতে হয়

// ✅ Default safe response (Crew বাদ দেওয়া হয়েছে এবং UI-এর সাথে মেলানো হয়েছে)
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
    family_and_kids: 0,
    critics_and_cinephiles: 0
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
    return JSON.parse(text);
  } catch {
    return defaultResponse;
  }
};

const getDetailedAiAnalysis = async (movieTitle, lang = "en") => {
  const langMap = {
    hi: "Hindi",
    bn: "Bengali",
    en: "English"
  };

  const languageText = langMap[lang] || "English";

  // 🔥 Smart model selection (cost control)
  const model =
    lang === "en"
      ? "llama-3.1-8b-instant" // ⚡ cheap + fast
      : "llama-3.3-70b-versatile"; // 🎯 better quality for non-English

  try {
    // 🌐 ---------------------------------------------------------
    // Tavily দিয়ে লাইভ ইন্টারনেট সার্চ (বক্স অফিস ও বাজেটের জন্য)
    // ---------------------------------------------------------
    let liveInternetData = "No live data found.";
    try {
      console.log(`🔍 Tavily Searching live internet for: ${movieTitle}`);
      const tavilyResponse = await tavily.search(
        `${movieTitle} Indian movie exact budget, box office collection, star cast salary, OTT platform release deal`,
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

    // 🎯 The Magic Prompt for your Dream Design (Crew বাদ দেওয়া হয়েছে)
    const prompt = `Movie: "${movieTitle}". You are a top Indian movie critic and AI analyst for "Filmi Bharat".
    
    [CRITICAL LIVE DATA]: Here is the absolute latest information about this movie directly from the internet right now: "${liveInternetData}"
    
    Based ONLY on this live data and your existing knowledge, generate a DETAILED, CINEMATIC analysis in ${languageText}. 
    If the movie had a direct OTT release and no box office exists, clearly mention that or write "N/A".
    
    Return ONLY valid JSON matching this EXACT structure:
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
        "family_and_kids": 80,
        "critics_and_cinephiles": 70
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

module.exports = { getDetailedAiAnalysis };
