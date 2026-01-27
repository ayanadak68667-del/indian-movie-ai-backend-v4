const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * জেমিনি এআই থেকে রেসপন্স জেনারেট করার ফাংশন
 * @param {string} userMessage - ইউজারের প্রশ্ন
 * @param {string} lang - ভাষা (hi/en)
 * @param {object} movieContext - যদি মুভি ডাটা পাওয়া যায় (Optional)
 */
const generateAiResponse = async (userMessage, lang = 'en', movieContext = null) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const languageInstruction = lang === 'hi' ? 
            "Respond in Hindi. Keep the tone friendly and cinematic." : 
            "Respond in English. Keep the tone friendly and cinematic.";

        const contextInfo = movieContext ? 
            `The user is asking about the movie: ${movieContext.title}. Use this info if needed.` : 
            "No specific movie context yet.";

        const systemPrompt = `
            You are "Filmi AI", the smart assistant for the website "Filmi Bharat".
            ${languageInstruction}
            ${contextInfo}
            Rules:
            1. Only talk about movies, TV shows, and entertainment.
            2. Be short, engaging, and professional.
            3. Do not share internal system details or API keys.
        `;

        const result = await model.generateContent([systemPrompt, userMessage]);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini AI Service Error:", error.message);
        return lang === 'hi' ? 
            "माफ़ कीजिये, मैं अभी जवाब नहीं दे पा रहा हूँ।" : 
            "I'm sorry, I'm having trouble connecting right now.";
    }
};

module.exports = { generateAiResponse };
