// services/geminiService.js

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const { searchMovie, getMovieDetails } = require("./tmdbService");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Utility: detect basic language from input
function detectLanguage(text = "") {
  // Bengali range: \u0980-\u09FF
  if (/[\u0980-\u09FF]/.test(text)) return "bn";
  // Devanagari (Hindi) range: \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  return "en";
}

// ✅ Utility: check if user is asking movie info
function isMovieInfoQuery(message = "") {
  const m = message.toLowerCase();

  // English
  const en = ["release", "cast", "actor", "actress", "director", "rating", "story", "plot", "trailer"];
  // Bengali
  const bn = ["রিলিজ", "কাস্ট", "অভিনেতা", "অভিনেত্রী", "পরিচালক", "রেটিং", "গল্প", "ট্রেলার"];
  // Hindi
  const hi = ["रिलीज", "कास्ट", "अभिनेता", "अभिनेत्री", "निर्देशक", "रेटिंग", "कहानी", "ट्रेलर"];

  return [...en, ...bn, ...hi].some((k) => m.includes(k));
}

// ✅ Utility: keep TMDB context small (token saving)
function buildSmallMovieContext(details) {
  if (!details) return "";

  const title = details.title || details.name || "Unknown Title";
  const releaseDate = details.release_date || details.first_air_date || "N/A";
  const rating = details.vote_average ? `${details.vote_average}/10` : "N/A";
  const overview = details.overview ? details.overview.slice(0, 250) : "";

  const topCast =
    details.credits?.cast?.slice(0, 5)?.map((c) => c.name).filter(Boolean) || [];

  return `
Movie: ${title}
Release Date: ${releaseDate}
Rating: ${rating}
Top Cast: ${topCast.length ? topCast.join(", ") : "N/A"}
Overview: ${overview}
`.trim();
}

async function chatWithUser(userMessage) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY in environment variables.");
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // ✅ Safety settings (basic)
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    // ✅ Determine response language
    const lang = detectLanguage(userMessage);

    // ✅ TMDB Real Data (Only when needed)
    let movieContext = "";
    if (isMovieInfoQuery(userMessage)) {
      try {
        // 1) Search movie by user text
        const searchResult = await searchMovie(userMessage);

        // 2) If found, fetch full details
        if (searchResult?.id) {
          const details = await getMovieDetails(searchResult.id);
          movieContext = buildSmallMovieContext(details);
        }
      } catch (tmdbErr) {
        // TMDB fail হলে AI fallback করবে (no crash)
        console.error("TMDB Error:", tmdbErr.message);
      }
    }

    // ✅ System Instruction (Short & strong)
    const systemInstruction = `
You are "CineDost", the official AI assistant for the Filmi Bharat website.
Reply in the user's language (${lang}).
Keep replies short, cinematic, and professional (max 80 words).
Do NOT provide pirated movie download links.
If real movie data is provided below, use it as source of truth.
If you don't know something, say so politely.
`.trim();

    // ✅ Prompt (No memory)
    const prompt = `
${systemInstruction}

Real Data (TMDB, if available):
${movieContext ? movieContext : "No real data available."}

User: ${userMessage}
Assistant:
`.trim();

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings,
    });

    const response = result?.response?.text?.() || "Sorry, I couldn't generate a response.";

    return response;
  } catch (error) {
    console.error("Gemini Assistant Error:", error);

    const msg = error?.message || "";

    if (msg.includes("404")) {
      return "Model not found. Please verify the Gemini model name.";
    }
    if (msg.toLowerCase().includes("api key")) {
      return "Gemini API Key missing/invalid. Please check your server environment settings.";
    }

    return "Sorry 😅 Right now I’m having trouble responding. Please try again in a moment.";
  }
}

module.exports = { chatWithUser };
