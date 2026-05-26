const express = require("express");
const router = express.Router();
const tmdbService = require("../services/tmdbService");

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// প্রতিটি ক্যাটাগরিতে ৩০ জন করে জেনুইন ইন্ডিয়ান অ্যাক্টরের আইডি লিস্ট
  const STAR_IDS = {
      bollywood: [
  35742,   // Shah Rukh Khan
  85034,   // Ranbir Kapoor
  35070,   // Akshay Kumar
  42802,   // Salman Khan
  1173809, // Kartik Aaryan
  78749,   // Hrithik Roshan
  1108120, // Alia Bhatt
  53975,   // Deepika Padukone
  42803,   // Ajay Devgn
  234135,  // Varun Dhawan
  1114002, // Tiger Shroff
  113941,  // Sidharth Malhotra
  35774,   // Shahid Kapoor
  1372782, // Kiara Advani
  1334460, // Shraddha Kapoor
  1120014, // Janhvi Kapoor
  1042714, // Anushka Sharma
  81869,   // Katrina Kaif
  52763,   // Aamir Khan
  35745,   // Rani Mukerji
  35743,   // Preity Zinta
  35776,   // Kajol
  5473,    // Madhuri Dixit
  63513,   // Bipasha Basu
  1115783, // Taapsee Pannu
  1215160, // Popular Female Star
  53139,   // Sonam Kapoor
  35771,   // Anil Kapoor
  5472,    // Sridevi
  35775    // Karisma Kapoor
],

 tollywood: [
  237045,  // Prabhas
  108215,  // Allu Arjun
  108916,  // Jr NTR
  55010,   // Mahesh Babu
  63631,   // Ram Charan
  1699988, // Vijay Deverakonda
  1323326, // Pawan Kalyan
  12053,   // Chiranjeevi
  225312,  // Samantha Ruth Prabhu
  147028,  // Rashmika Mandanna
  122416,  // Pooja Hegde
  113134,  // Kajal Aggarwal
  57088,   // Nayanthara
  59779,   // Tamannaah Bhatia
  58000,   // Anushka Shetty
  139626,  // Sai Pallavi
  144186,  // Keerthy Suresh
  113171,  // Ramya Krishnan
  119565,  // Prakash Raj
  142106,  // Mohanlal
  1530960, // Dulquer Salmaan
  1380064, // Nani
  162507,  // Siddharth
  158102,  // Dhanush
  113129,  // Suriya
  1073860, // Vishal
  55010,   // Mahesh Babu
  108215,  // Allu Arjun
  63631,   // Ram Charan
  1699988  // Vijay Deverakonda
], 
    tv: [
  1513214, // Kapil Sharma
  2352514, // Tejasswi Prakash
  1551068, // Shivangi Joshi
  1251148, // Hina Khan
  1787889, // Samridhii Shukla
  1632766, // Rohit Purohit
  1443657, // Priyanka Chahar Choudhary
  1322026, // Ayesha Singh
  1588661, // Bharti Singh
  2161245, // Karan Kundrra
  2151631, // Harsh Limbachiyaa
  1709400, // Indian TV Personality
  1912443, // Indian TV Actor
  1642220, // Indian TV Star
  2244900, // Indian TV Celebrity
  1500366, // Indian TV Actress
  2184179, // Indian TV Trending
  2011986, // Indian TV Actor
  1251144, // Indian TV Personality
  1395535, // Indian TV Actor
  1243577, // Indian TV Actress
  1784941, // Indian TV Star
  2108741, // Indian TV Celebrity
  60565,   // Indian TV Personality
  1243573, // Indian TV Actress
  574483,  // Indian TV Actor
  1395535, // Extra
  1251144, // Extra
  1551068, // Extra
  2352514  // Extra
]
    
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
