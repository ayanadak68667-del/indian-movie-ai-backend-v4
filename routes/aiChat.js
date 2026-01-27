const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
    const { message, lang } = req.body;

    try {
        // Search for movie link
        const search = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: { api_key: process.env.TMDB_API_KEY, query: message, language: lang === 'hi' ? 'hi-IN' : 'en-US' }
        });

        const movieCard = search.data.results[0] ? {
            id: search.data.results[0].id,
            title: search.data.results[0].title,
            poster: `https://image.tmdb.org/t/p/w200${search.data.results[0].poster_path}`
        } : null;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are Filmi AI. Help the user in ${lang === 'hi' ? 'Hindi' : 'English'}. Be cinematic! Movie Found: ${movieCard?.title || 'None'}`;
        
        const result = await model.generateContent(message);
        res.json({ reply: result.response.text(), card: movieCard });
    } catch (error) {
        res.status(500).json({ reply: "I'm offline for a moment!" });
    }
});

module.exports = router;
