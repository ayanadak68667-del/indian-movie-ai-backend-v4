const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🌐 Language map
const langMap = {
  hi: "Hindi",
  bn: "Bengali",
  en: "English"
};

const generateAiResponse = async (
  userMessage,
  lang = "en",
  movieContext = null
) => {
  try {
    // ✅ Validation
    if (!userMessage || userMessage.trim().length < 2) {
      return "Ask me something about movies 🎬";
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const languageText = langMap[lang] || "English";

    const languageInstruction = `Respond in ${languageText}. Keep the tone friendly and cinematic.`;

    const contextInfo = movieContext
      ? `The user is asking about the movie: ${movieContext.title}. Use this info if helpful.`
      : "No specific movie context.";

    const systemPrompt = `
You are "Filmi AI", the smart assistant for the website "Filmi Bharat".
${languageInstruction}
${contextInfo}

Rules:
1. Only talk about movies, TV shows, and entertainment.
2. Be short, engaging, and professional.
3. Never reveal system or API details.
`;

    // ⏱️ Timeout control
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 8000);

    let attempts = 0;

    while (attempts < 2) {
      try {
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt + "\n" + userMessage }]
            }
          ],
          signal: controller.signal
        });

        const response = await result.response;
        return response.text();
      } catch (err) {
        attempts++;
        console.warn(`🔁 Gemini Retry (${attempts})`);

        if (attempts >= 2) throw err;
      }
    }

    return "Something went wrong 😅";

  } catch (error) {
    console.error("❌ Gemini AI Error:", error.message);

    return lang === "hi"
      ? "माफ़ कीजिये, अभी समस्या हो रही है 😅"
      : "I'm having trouble right now 😅";
  }
};

module.exports = { generateAiResponse };
