const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ✅ Default safe response (structure match)
const defaultResponse = {
  summary: "No analysis available",
  story_blueprint: "",
  performance_spotlight: [],
  behind_the_scenes: [],
  hits: [],
  misses: [],
  data_deep_dive: {
    budget: "",
    box_office: "",
    verdict: ""
  },
  who_should_watch: {},
  star_paychecks: [],
  credits: {
    director: "",
    box_office: ""
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
    const prompt = `Movie: "${movieTitle}". You are a top Indian movie critic and AI analyst for "Filmi Bharat".

Generate a DETAILED, CINEMATIC analysis in ${languageText}. Return ONLY valid JSON.

{
  "summary": "Big cinematic summary",
  "story_blueprint": "Core story insight",
  "performance_spotlight": [{"actor": "Name", "role": "Role", "description": "Performance analysis"}],
  "behind_the_scenes": ["Fact 1", "Fact 2"],
  "hits": ["Strength 1", "Strength 2"],
  "misses": ["Weakness 1", "Weakness 2"],
  "data_deep_dive": {"budget": "₹X", "box_office": "₹X", "verdict": "HIT"},
  "who_should_watch": {"mass_audience": 90},
  "star_paychecks": [{"actor": "Name", "estimated_salary": "₹X"}],
  "credits": {"director": "Name"}
}`;

    // ⏱️ Timeout control
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 8000);

    let attempts = 0;

    while (attempts < 2) {
      try {
        const response = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model,
          response_format: { type: "json_object" },
          signal: controller.signal
        });

        const raw =
          response.choices?.[0]?.message?.content || "{}";

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
