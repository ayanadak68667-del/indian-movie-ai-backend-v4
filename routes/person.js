const express = require("express");
const router = express.Router();
const tmdbService = require("../services/tmdbService");

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// প্রতিটি ক্যাটাগরিতে ৩০ জন করে জেনুইন ইন্ডিয়ান অ্যাক্টরের আইডি লিস্ট
  const STAR_IDS = {
  bollywood: [
    35742, 52763, 52736, 78749, 35770, 10814, 35776, 178224, 1120014, 53139, 
    139534, 1108120, 35743, 35745, 38940, 63513, 1042714, 1215160, 1115783, 1372782, 
    1334460, 234135, 1114002, 113941, 1173809
  ],
  tollywood: [
    55010, 108215, 63631, 113134, 82248, 57088, 59779, 58000, 12053, 1323326, 
    73421, 147028, 139626, 122416, 1073860, 144186, 113171, 119565, 142106, 1699988, 
    1530960, 1380064, 162507, 158102, 113129
  ],
  tv: [
    1251144, 1395535, 1251148, 1243577, 1551068, 2352514, 1787889, 1632766, 1443657, 1322026, 
    1588661, 2161245, 2151631, 1709400, 1912443, 1642220, 2244900, 1500366, 2184179, 2011986, 
    1784941, 2108741, 60565, 1243573, 574483
  ]
};


// হেল্পার ফাংশন: আইডি থেকে রিয়াল-টাইম ডেটা আনার জন্য
const fetchActorsData = async (ids, lang = "en") => {
  try {
    const promises = ids.map(id => tmdbService.getPersonDetails(id, lang));
    const results = await Promise.all(promises);
    
    return results.map(person => {
      if (!person) return null;
      return {
        id: person.id,
        name: person.name,
        profile_path: person.profile_path ? `${IMAGE_BASE}${person.profile_path}` : null
      };
    }).filter(person => person !== null);
  } catch (error) {
    console.error("Error fetching actor data:", error);
    return [];
  }
};

// প্যাগিনেশন হেল্পার ফাংশন
const getPaginatedStars = async (req, res, industryKey) => {
  try {
    const lang = req.query.lang || "en";
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 20; 
    
    const allIds = STAR_IDS[industryKey];
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedIds = allIds.slice(startIndex, endIndex);

    const data = await fetchActorsData(paginatedIds, lang);

    res.json({
      success: true,
      page: page,
      total_pages: Math.ceil(allIds.length / limit),
      total_results: allIds.length,
      data: data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ১️⃣ হোমপেজ ও ভিউ অল পেজের প্যাগিনেশন রাউটস
router.get("/bollywood-stars", (req, res) => getPaginatedStars(req, res, "bollywood"));
router.get("/tollywood-stars", (req, res) => getPaginatedStars(req, res, "tollywood"));
router.get("/tv-celebrities", (req, res) => getPaginatedStars(req, res, "tv"));

// ২️⃣ অ্যাক্টরের ডিটেইলস এবং তার মুভি লিস্ট
router.get("/:id", async (req, res) => {
  const personId = req.params.id;
  const lang = req.query.lang || "en";

  try {
    const [details, credits] = await Promise.all([
      tmdbService.getPersonDetails(personId, lang),
      tmdbService.getPersonCredits(personId, lang)
    ]);

    if (!details) {
      return res.status(404).json({ success: false, message: "Actor not found" });
    }

    let works = credits?.cast || [];
    works = works
      .filter(w => w.poster_path) 
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 30); 

    const formattedWorks = works.map(m => ({
      id: m.id,
      title: m.title || m.name,
      poster: `${IMAGE_BASE}${m.poster_path}`,
      media_type: m.media_type,
      rating: m.vote_average ? m.vote_average.toFixed(1) : null,
      year: m.release_date ? m.release_date.split('-')[0] : (m.first_air_date ? m.first_air_date.split('-')[0] : '')
    }));

    res.json({
      success: true,
      data: {
        profile: {
          id: details.id,
          name: details.name,
          biography: details.biography || "Biography not available at this moment.",
          birthday: details.birthday,
          place_of_birth: details.place_of_birth,
          profile_image: details.profile_path ? `${IMAGE_BASE}${details.profile_path}` : null,
          known_for: details.known_for_department
        },
        movies: formattedWorks
      }
    });

  } catch (error) {
    console.error("Person API Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch actor details" });
  }
});

module.exports = router;
