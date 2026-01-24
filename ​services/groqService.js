const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * TMDB ডেটা থেকে মুভির গভীর বিশ্লেষণ তৈরি করা
 */
const generateMovieAnalysis = async (movieData, lang = 'en') => {
    try {
        // ল্যাঙ্গুয়েজ অনুযায়ী ইনস্ট্রাকশন সেট করা
        const languageName = lang === 'hi' ? 'Hindi' : 'English';

        // আপনার ব্লু-প্রিন্ট অনুযায়ী কড়া ইনস্ট্রাকশন (System Prompt)
        const systemPrompt = `
You are a senior film critic for "Filmi Bharat". 
Your task is to analyze movie data and provide a cinematic dashboard in ${languageName}.
Strictly follow this 5-block structure:

1. 🎬 Synopsis: A short, gripping 2-paragraph story summary.
2. 🎭 Performance Spotlight: Critically analyze the lead actors' performances.
3. 📊 The Scorecard: Provide 3 Pros (✅) and 3 Cons (❌) in bullet points.
4. 💰 Data Deep Dive: Discuss the production scale, budget, and box office success.
5. 🎯 Who Should Watch This?: Suggest who will enjoy this movie (e.g., action lovers, families).

Constraints: 
- Language: ${languageName} only.
- Tone: Professional & Premium.
- Max Word Limit: 350 words.
        `.trim();

        // TMDB থেকে আসা Raw Data-কে সাজানো
        const movieInfo = `
Title: ${movieData.title}
Overview: ${movieData.overview}
Cast: ${movieData.credits?.cast?.slice(0, 5).map(c => c.name).join(', ')}
Genres: ${movieData.genres?.map(g => g.name).join(', ')}
Budget: $${movieData.budget || 'N/A'}
Revenue: $${movieData.revenue || 'N/A'}
        `.trim();

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: movieInfo }
            ],
            model: 'llama3-8b-8192', // সুপার ফাস্ট এবং নিখুঁত মডেল
            temperature: 0.6, // সৃজনশীলতা এবং তথ্যের ভারসাম্য রাখতে
            max_tokens: 1000,
        });

        return chatCompletion.choices[0].message.content;

    } catch (error) {
        console.error("Groq Analysis Error:", error.message);
        return null; // এরর হলে নাল রিটার্ন করবে যাতে ক্যাশ রিলাই করতে পারে
    }
};

module.exports = { generateMovieAnalysis };
