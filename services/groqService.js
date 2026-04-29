const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ✅ Default safe response (Mapped perfectly for Frontend)
const defaultResponse = {
  summary: "",
  hits: [],
  misses: [],
  bts: [],
  paychecks: []
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
    // 🎯 Stricter & Lighter Prompt (Matches MovieAnalysis.jsx exactly)
    const prompt = `Movie: "${movieTitle}". You are a top Indian movie critic and AI analyst for "Filmi Bharat".
Generate a DETAILED, CINEMATIC analysis in ${languageText}. Return ONLY valid JSON matching this exact structure:
{
  "summary": "1-2 lines big cinematic summary",
  "hits": ["Strength 1", "Strength 2"],
  "misses": ["Weakness 1", "Weakness 2"],
  "bts": ["Behind the scenes fact 1", "Behind the scenes fact 2"],
  "paychecks": ["Actor Name: ₹X Cr", "Actor Name: ₹Y Cr"]
}`;

    let attempts = 0;

    while (attempts < 2) {
      try {
        const response = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model,
          response_format: { type: "json_object" }
          // ❌ 'signal' removed because Groq SDK does not support it
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
