const axios = require('axios');

const getMovieMedia = async (movieTitle, lang = 'en') => {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        const langSuffix = lang === 'hi' ? 'Hindi' : 'English';
        
        // ট্রেলার সার্চ
        const trailerRes = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
            params: {
                part: 'snippet',
                q: `${movieTitle} official trailer ${langSuffix}`,
                maxResults: 1,
                key: apiKey,
                type: 'video'
            }
        });

        // সং প্লেলিস্ট সার্চ (আপনার ওয়েবসাইটের স্পেশাল ফিচার)
        const songsRes = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
            params: {
                part: 'snippet',
                q: `${movieTitle} songs playlist ${langSuffix}`,
                maxResults: 4,
                key: apiKey,
                type: 'video'
            }
        });

        return {
            trailerId: trailerRes.data.items[0]?.id.videoId || '',
            playlist: songsRes.data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.high.url
            }))
        };
    } catch (error) {
        console.error("YouTube Service Error:", error.message);
        return { trailerId: '', playlist: [] };
    }
};

module.exports = { getMovieMedia };
