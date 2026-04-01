const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getDetailedAiAnalysis = async (movieTitle, lang = 'en') => {
    const languageText = lang === 'hi' ? "Hindi" : "English";

    try {
        const prompt = `Movie: "${movieTitle}". You are a top Indian movie critic and AI analyst for "Filmi Bharat".

Generate a DETAILED, CINEMATIC analysis in ${languageText}. Return ONLY valid JSON — no extra text.

{
  "summary": "Big, engaging, italic-style summary quote (2-3 lines)",
  "story_blueprint": "Large italic quote describing the core story and theme",
  "performance_spotlight": [
    {"actor": "Full Name", "role": "Character Name", "description": "2-3 sentences about their performance and contribution"}
  ],
  "behind_the_scenes": [
    "Fact 1 about VFX, shooting, or making",
    "Fact 2 about locations, challenges, or trivia"
  ],
  "hits": [
    "Positive point 1 (e.g. Stunning cinematography)",
    "Positive point 2 (e.g. Powerhouse performances)"
  ],
  "misses": [
    "Criticism 1 (e.g. Pacing dips in second half)",
    "Criticism 2 (e.g. Some scenes feel stretched)"
  ],
  "data_deep_dive": {
    "budget": "₹X Crore (estimated)",
    "box_office": "₹X Crore+",
    "verdict": "BLOCKBUSTER / HIT / AVERAGE / FLOP"
  },
  "who_should_watch": {
    "horror_lovers": 95,
    "critics": 80,
    "mass_audience": 90
  },
  "star_paychecks": [
    {"actor": "Name", "role": "Character", "estimated_salary": "₹X Crore"},
    {"actor": "Name", "role": "Character", "estimated_salary": "₹X Crore"}
  ],
  "credits": {
    "director": "Name",
    "box_office": "₹X crore+"
  }
}

Rules:
- Use realistic Indian movie estimates for salary, budget, box office.
- All text in ${languageText}.
- Make it cinematic, engaging, detailed — like a professional critic.
- NEVER leave any array or field empty — always fill with realistic content.
- Add disclaimer for salaries/box office: "Estimated based on reports".
`;
        const response = await groq.chat.completions.create({
  messages: [{ role: "user", content: prompt }],
  model: "llama-3.3-70b-versatile",
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
