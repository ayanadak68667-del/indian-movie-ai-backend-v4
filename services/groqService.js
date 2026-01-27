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
          "paychecks": [{"actor": "Name", "role": "Character", "estimated_salary": "Amount"}],
          "bts": ["Fact 1", "Fact 2"]
        }
        Keep paychecks as realistic estimates with the language requested. No text before/after JSON.`;

        const response = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-8b-8192",
            response_format: { type: "json_object" }
        });
        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        return { hits: [], misses: [], paychecks: [], bts: [] };
    }
};

module.exports = { getDetailedAiAnalysis };
