const axios = require("axios");

// .env ফাইলে তোমার RapidAPI Key রাখতে হবে
const RAPID_API_KEY = process.env.RAPIDAPI_KEY;

class OTTService {
  async getStreamingInfo(title) {
    try {
      const options = {
        method: 'GET',
        url: 'https://streaming-availability.p.rapidapi.com/shows/search/title',
        params: {
          country: 'in', // শুধুমাত্র ভারতের স্ট্রিমিং ডেটা
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

      // ডেটা সাজানোর লজিক (TMDB এর মতো স্ট্রাকচার তৈরি করা)
      let formattedWatchProviders = { flatrate: [], rent: [], buy: [] };

      if (data && data.length > 0) {
        const movieData = data[0]; // সবচেয়ে প্রাসঙ্গিক মুভিটি নিচ্ছি
        const streamingOptions = movieData.streamingOptions?.in || [];

        // ডুপ্লিকেট প্ল্যাটফর্ম রিমুভ করার জন্য Set ব্যবহার করছি
        const uniquePlatforms = new Set();

        streamingOptions.forEach(option => {
          const providerName = option.service.name;
          
          if (!uniquePlatforms.has(providerName)) {
            uniquePlatforms.add(providerName);
            
            // TMDB-এর মতো অবজেক্ট বানাচ্ছি যাতে ফ্রন্টএন্ড ব্রেক না করে
            formattedWatchProviders.flatrate.push({
              provider_name: providerName,
              logo_path: option.service.imageSet?.lightThemeImage // (ঐচ্ছিক) লোগো
            });
          }
        });
      }

      // যদি কোনো ডেটা না পায়, তবে ফাঁকা পাঠাবে
      return formattedWatchProviders;

    } catch (error) {
      console.error("❌ RapidAPI OTT Error:", error.message);
      return { flatrate: [] }; // ফেইল করলেও অ্যাপ ক্র্যাশ করবে না
    }
  }
}

module.exports = new OTTService();
