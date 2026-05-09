const express = require("express");
const router = express.Router();
const animeService = require("../services/animeService");

// 🔥 Jikan Data কে TMDB ফরম্যাটে কনভার্ট করার ম্যাজিক ফাংশন
const transformAnime = (anime) => ({
  id: anime.mal_id,
  title: anime.title_english || anime.title,
  poster: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
  backdrop: anime.trailer?.images?.maximum_image_url || anime.images?.jpg?.large_image_url,
  vote_average: anime.score,
  release_date: anime.aired?.from ? anime.aired.from.split('T')[0] : '',
  overview: anime.synopsis,
  media_type: 'anime'
});

// ১️⃣ TRENDING ANIME
router.get("/trending", async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await animeService.getTrendingAnime(page);
    
    if (!data || !data.data) return res.json({ success: true, data: [] });

    const formattedData = data.data.map(transformAnime);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Anime Trending Error:", error.message);
    res.status(500).json({ success: false, data: [] });
  }
});

// ২️⃣ SEARCH ANIME
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    const page = req.query.page || 1;
    
    if (query.length < 3) return res.json({ success: true, data: [] });

    const data = await animeService.searchAnime(query, page);
    if (!data || !data.data) return res.json({ success: true, data: [] });

    const formattedData = data.data.map(transformAnime);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Anime Search Error:", error.message);
    res.status(500).json({ success: false, data: [] });
  }
});

// ৩️⃣ ANIME DETAILS
router.get("/:id", async (req, res) => {
   try {
     const data = await animeService.getAnimeDetails(req.params.id);
     if (!data || !data.data) return res.status(404).json({ success: false, message: "Anime not found" });

     const anime = data.data;
     const details = transformAnime(anime);
     
     // এক্সট্রা ডিটেইলস (এপিসোড, স্ট্যাটাস, ট্রেইলার)
     details.episodes = anime.episodes;
     details.status = anime.status;
     details.genres = anime.genres;
     details.trailerId = anime.trailer?.youtube_id;

     res.json({ success: true, data: details });
   } catch(error) {
     console.error("Anime Detail Error:", error.message);
     res.status(500).json({ success: false, message: "Server error" });
   }
});

module.exports = router;
