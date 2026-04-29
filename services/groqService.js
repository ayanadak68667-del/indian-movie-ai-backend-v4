const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ✅ Default safe response (Mapped perfectly for your NEW Dream Design)
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
  bts: [],
  crew: {
    director: "Not Available",
    producer: "Not Available",
    music: "Not Available"
  }
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
    // 🎯 The Magic Prompt for your Dream Design
    const prompt = `Movie: "${movieTitle}". You are a top Indian movie critic and AI analyst for "Filmi Bharat".
Generate a DETAILED, CINEMATIC analysis in ${languageText}. Return ONLY valid JSON matching this EXACT structure:
{
  "summary": "1-2 lines big cinematic summary",
  "ai_verdict": "One short phrase verdict (e.g., Cinematic Masterpiece, Blockbuster, Average, Disaster)",
  "data_deep_dive": {
    "budget": "₹X Crore",
    "box_office": "₹Y Crore",
    "verdict": "Blockbuster / Hit / Flop",
    "indian_roi": "X%",
    "global_roi": "Y%"
  },
  "who_should_watch": {
    "mass_audience": 90,
    "family": 80,
    "kids": 40
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
  "bts": ["Behind the scenes fact 1", "Behind the scenes fact 2"],
  "crew": {
    "director": "Director Name",
    "producer": "Producer Name",
    "music": "Music Director Name"
  }
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
