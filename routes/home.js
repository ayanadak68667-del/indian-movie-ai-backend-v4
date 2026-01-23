// Mood to Genre ID Mapping
const moodMap = {
    romantic: 10749,
    thriller: 53,
    comedy: 35,
    horror: 27,
    action: 28,
    emotional: 18
};

router.get('/api/mood', async (req, res) => {
    const { type } = req.query; // যেমন: ?type=romantic
    const genreId = moodMap[type];

    if (!genreId) return res.status(400).send("Invalid Mood Type");

    try {
        // TMDB থেকে ওই জেনারের টপ মুভিগুলো আনা
        const movies = await tmdbService.getMoviesByGenre(genreId);
        
        // ঐচ্ছিক: মুভিগুলোকে আরও স্পেশাল করতে Groq বা Gemini দিয়ে শর্টলিস্ট করতে পারেন
        res.json(movies);
    } catch (error) {
        res.status(500).send("Server Error");
    }
});
