const Movie = require('../models/Movie');
const tmdbService = require('../services/tmdbService');
const groqService = require('../services/groqService');
const youtubeService = require('../services/youtubeService');

// ৩০ দিনের ক্যাশ টাইম (চাও তো ২৪hও করতে পারো)
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30;

// মুভি ডিটেইলস পেজের জন্য মেইন ফাংশন
const getMovieDetailsPage = async (req, res) => {
    const movieId = req.params.id;
    const lang = req.query.lang || 'en'; // en / hi
    const cacheKey = `${movieId}_${lang}`; // language-wise আলাদা cache

    try {
        // ১. MongoDB cache খোঁজা
        let cachedMovie = await Movie.findOne({ tmdbId: cacheKey });

        // ২. cache পুরনো কি না চেক করা
        if (cachedMovie) {
            const isStale =
                Date.now() - new Date(cachedMovie.lastUpdated).getTime() > CACHE_TTL;

            if (!isStale) {
                // ফ্রেশ cache থাকলে সেটাই রিটার্ন
                return res.json({ source: 'mango-case', data: cachedMovie });
            }
            // পুরনো হলে নিচে গিয়ে আবার লাইভ ফেচ হবে
        }

        // ৩. TMDB থেকে ডিটেইলস আনা (ভাষা অনুযায়ী)
        const tmdbData = await tmdbService.getMovieDetails(movieId, lang);
        if (!tmdbData) {
            return res.status(404).json({ message: "Movie not found" });
        }

        // ৪. Groq AI + YouTube প্যারালাল ফেচ (স্পিডের জন্য)
        const [aiData, media] = await Promise.all([
            groqService.getDetailedAiAnalysis(tmdbData.title, lang).catch(() => null),
            youtubeService.getMovieMedia(tmdbData.title, lang).catch(() => null)
        ]);

        // ৫. ফাইনাল অবজেক্ট তৈরি
        const finalMovieData = {
            tmdbId: cacheKey,
            details: tmdbData,
            aiAnalysis: aiData,
            media: media,
            lastUpdated: new Date()
        };

        // ৬. upsert: থাকলে আপডেট, না থাকলে নতুন তৈরি
        const savedMovie = await Movie.findOneAndUpdate(
            { tmdbId: cacheKey },
            finalMovieData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.json({ source: 'live-api', data: savedMovie });

    } catch (error) {
        console.error("Controller Error:", error.message);
        res.status(500).json({ error: "Failed to load movie details" });
    }
};

module.exports = { getMovieDetailsPage };
