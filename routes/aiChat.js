const express = require('express');
const router = express.Router();
const axios = require('axios');
const { generateAiResponse } = require('../services/aiService');

router.post('/', async (req, res) => {
    const { message, lang } = req.body;

    try {
        // ১. TMDB-তে মুভি সার্চ করা (কার্ড দেখানোর জন্য)
        const tmdbSearch = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: { 
                api_key: process.env.TMDB_API_KEY, 
                query: message, 
                language: lang === 'hi' ? 'hi-IN' : 'en-US' 
            }
        });

        const movieData = tmdbSearch.data.results[0] || null;
        let movieCard = null;

        if (movieData) {
            movieCard = {
                id: movieData.id,
                title: movieData.title,
                poster: `https://image.tmdb.org/t/p/w200${movieData.poster_path}`
            };
        }

        // ২. AI সার্ভিস থেকে উত্তর নেওয়া
        const aiReply = await generateAiResponse(message, lang, movieData);

        // ৩. উত্তর এবং মুভি কার্ড পাঠানো
        res.json({
            reply: aiReply,
            card: movieCard // যদি মুভি খুঁজে পায় তবেই কার্ড যাবে, নাহলে null
        });

    } catch (error) {
        res.status(500).json({ reply: "Something went wrong with Filmi AI." });
    }
});

module.exports = router;
