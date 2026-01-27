const axios = require('axios');

const getMovieDetails = async (movieId, lang = 'en') => {
    try {
        const tmdbLang = lang === 'hi' ? 'hi-IN' : 'en-US';
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
            params: {
                api_key: process.env.TMDB_API_KEY,
                append_to_response: 'credits,videos',
                language: tmdbLang
            }
        });
        return response.data;
    } catch (error) {
        console.error("TMDB Service Error:", error.message);
        return null;
    }
};

module.exports = { getMovieDetails };
