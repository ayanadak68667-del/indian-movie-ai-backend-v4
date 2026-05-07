const axios = require("axios");

const RAPID_API_KEY = process.env.RAPIDAPI_KEY;

class OTTService {
  async getStreamingInfo(title) {
    try {
      console.log(`📡 Fetching OTT info from RapidAPI for: ${title}`);
      
      const options = {
        method: 'GET',
        url: 'https://streaming-availability.p.rapidapi.com/shows/search/title',
        params: {
          country: 'in', 
          title: title,
          show_type: 'movie'
        },
        headers: {
          'X-RapidAPI-Key': RAPID_API_KEY,
          'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com'
        }
      };

      const response = await axios.request(options);
      const data = response.data;

      // 🔍 Debug log: এটি চেক করলে তুমি Render কনসোলে আসল ডেটা দেখতে পাবে
      // console.log("RapidAPI Full Response:", JSON.stringify(data));

      let formattedWatchProviders = { flatrate: [], rent: [], buy: [] };

      // এপিআই যদি অ্যারে পাঠায়
      if (Array.isArray(data) && data.length > 0) {
        const movieData = data[0];
        const streamingOptions = movieData.streamingOptions?.in || [];

        const uniquePlatforms = new Set();

        streamingOptions.forEach(option => {
          const providerName = option.service.name;
          
          if (!uniquePlatforms.has(providerName)) {
            uniquePlatforms.add(providerName);
            
            formattedWatchProviders.flatrate.push({
              provider_name: providerName,
              logo_path: option.service.imageSet?.lightThemeImage || null
            });
          }
        });
      }

      console.log(`✅ Successfully found ${formattedWatchProviders.flatrate.length} streaming platforms for ${title}`);
      return formattedWatchProviders;

    } catch (error) {
      console.error("❌ RapidAPI OTT Error:", error.response?.data?.message || error.message);
      return { flatrate: [] }; 
    }
  }
}

module.exports = new OTTService();
