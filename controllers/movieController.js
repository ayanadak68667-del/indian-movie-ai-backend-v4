const Movie = require('../models/Movie');
const tmdbService = require('../services/tmdbService');
const groqService = require('../services/groqService');
const youtubeService = require('../services/youtubeService');

// মুভি ডিটেইলস পেজের জন্য মেইন ফাংশন
const getMovieDetailsPage = async (req, res) => {
    const movieId = req.params.id;
    const lang = req.query.lang || 'en'; // ভাষা টগল (en/hi)
    const cacheKey = `${movieId}_${lang}`; // Mango Case কি (Key)

    try {
        // ১. Mango Case (MongoDB Cache) চেক করা
        let cachedMovie = await Movie.findOne({ tmdbId: cacheKey });
        if (cachedMovie) {
            return res.json({ source: 'mango-case', data: cachedMovie });
        }

        // ২. TMDB থেকে ডাটা আনা (ভাষা অনুযায়ী)
        const tmdbData = await tmdbService.getMovieDetails(movieId, lang);
        if (!tmdbData) return res.status(404).json({ message: "Movie not found" });

        // ৩. Groq AI এবং YouTube থেকে প্যারালাল ডাটা ফেচ (স্পিড বাড়ানোর জন্য)
        const [aiData, media] = await Promise.all([
            groqService.getDetailedAiAnalysis(tmdbData.title, lang),
            youtubeService.getMovieMedia(tmdbData.title, lang)
        ]);

        // ৪. আপনার ডিজাইন অনুযায়ী ডাটা অবজেক্ট তৈরি
        const finalMovieData = {
            tmdbId: cacheKey,
            details: tmdbData,
            aiAnalysis: aiData, // Hits, Misses, Paychecks, BTS
            media: media, // Trailers, Playlists
            lastUpdated: new Date()
        };

        // ৫. ডাটাবেসে সেভ (৩০ দিনের জন্য)
        const savedMovie = await Movie.create(finalMovieData);

        res.json({ source: 'live-api', data: savedMovie });

    } catch (error) {
        console.error("Controller Error:", error.message);
        res.status(500).json({ error: "Failed to load movie details" });
    }
};

module.exports = { getMovieDetailsPage };
