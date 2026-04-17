const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const { generateAiResponse } = require("../services/aiService");

router.post("/", async (req, res) => {
  const { message, lang = "en" } = req.body;

  try {
    // ✅ Basic validation
    if (!message || message.trim().length < 2) {
      return res.json({
        reply: "Please ask something meaningful 🎬",
        card: null
      });
    }

    // 🔍 Use TMDB SERVICE (🔥 FIXED)
    const searchResult = await tmdbService.searchMulti(
      message,
      lang
    );

    const movieData = searchResult?.results?.[0] || null;

    let movieCard = null;

    if (movieData) {
      movieCard = {
        id: movieData.id,
        title: movieData.title || movieData.name,
        poster: movieData.poster_path
          ? `https://image.tmdb.org/t/p/w200${movieData.poster_path}`
          : ""
      };
    }

    // 🤖 AI Response
    const aiReply = await generateAiResponse(
      message,
      lang,
      movieData
    );

    // ✅ Final response
    res.json({
      reply: aiReply,
      card: movieCard
    });

  } catch (error) {
    console.error("❌ AI Chat Error:", error.message);

    res.status(500).json({
      reply:
        lang === "hi"
          ? "कुछ गड़बड़ हो गया 😅"
          : "Something went wrong with Filmi AI 😅",
      card: null
    });
  }
});

module.exports = router;
