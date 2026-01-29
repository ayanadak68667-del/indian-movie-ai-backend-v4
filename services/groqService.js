const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getDetailedAiAnalysis = async (movieTitle, lang = 'en') => {
    const languageText = lang === 'hi' ? "Hindi" : "English";

    try {
        const prompt = `Movie: "${movieTitle}". You are a movie expert. Generate a detailed analysis in ${languageText}.
Format strictly as JSON:
{
  "hits": ["Point 1", "Point 2"],
  "misses": ["Point 1", "Point 2"],
  "paychecks": [
    {"actor": "Name", "role": "Character", "estimated_salary": "Amount"}
  ],
  "bts": ["Fact 1", "Fact 2"]
}
Rules:
- Realistic Indian salary estimates (in Crores if Indian movie).
- No explanation text before or after JSON.
- Write all text in ${languageText}.`;

        const response = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "mixtral-8x7b-32768",
            response_format: { type: "json_object" }
        });

        const raw = response.choices?.[0]?.message?.content || "{}";

        try {
            return JSON.parse(raw);
        } catch {
            return { hits: [], misses: [], paychecks: [], bts: [] };
        }

    } catch (error) {
        console.error("Groq Error:", error.message);
        return { hits: [], misses: [], paychecks: [], bts: [] };
    }
};

module.exports = { getDetailedAiAnalysis };
