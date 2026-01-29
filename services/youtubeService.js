const axios = require('axios');

const getMovieMedia = async (movieTitle, lang = 'en') => {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        const langSuffix = lang === 'hi' ? 'Hindi' : 'English';

        const baseUrl = 'https://www.googleapis.com/youtube/v3/search';

        // দুইটা রিকোয়েস্ট একসাথে চালানো
        const [trailerRes, songsRes] = await Promise.all([
            axios.get(baseUrl, {
                params: {
                    part: 'snippet',
                    q: `${movieTitle} official trailer ${langSuffix}`,
                    maxResults: 1,
                    key: apiKey,
                    type: 'video',
                    order: 'relevance'
                }
            }),
            axios.get(baseUrl, {
                params: {
                    part: 'snippet',
                    q: `${movieTitle} official songs playlist ${langSuffix}`,
                    maxResults: 4,
                    key: apiKey,
                    type: 'video',
                    order: 'relevance'
                }
            })
        ]);

        const trailerId =
            trailerRes.data?.items?.[0]?.id?.videoId || '';

        const playlist = (songsRes.data?.items || []).map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.high?.url || ''
        }));

        return { trailerId, playlist };

    } catch (error) {
        console.error("YouTube Service Error:", error.message);
        return { trailerId: '', playlist: [] };
    }
};

module.exports = { getMovieMedia };
