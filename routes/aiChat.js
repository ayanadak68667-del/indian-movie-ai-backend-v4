const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getAiResponse = async (userInput, userLanguage = 'Bengali') => {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // System Prompt যাতে অ্যাসিস্ট্যান্ট "Filmi Bharat" এর মত কথা বলে
    const prompt = `You are "CineDost", the personal AI assistant of Filmi Bharat website. 
    Help the user with movie recommendations and info. 
    Respond in ${userLanguage}. User says: ${userInput}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
};
