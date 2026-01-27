const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const tmdbService = require('../services/tmdbService');
const groqService = require('../services/groqService');
const youtubeService = require('../services/youtubeService');

router.get('/:id', async (req, res) => {
    const movieId = req.params.id;
    const lang = req.query.lang || 'en';
    const cacheKey = `${movieId}_${lang}`;

    try {
        let movie = await Movie.findOne({ tmdbId: cacheKey });
        if (movie) return res.json({ source: 'mango-case', data: movie });

        // Parallel Fetch for Speed
        const tmdbData = await tmdbService.getMovieDetails(movieId, lang);
        const [aiData, media] = await Promise.all([
            groqService.getDetailedAiAnalysis(tmdbData.title, lang),
            youtubeService.getMovieMedia(tmdbData.title, lang)
        ]);

        const finalMovie = await Movie.create({
            tmdbId: cacheKey,
            details: tmdbData,
            aiAnalysis: aiData,
            media: media
        });

        res.json({ source: 'live-api', data: finalMovie });
    } catch (error) {
        res.status(500).json({ error: "Failed to load movie details" });
    }
});

module.exports = router;
