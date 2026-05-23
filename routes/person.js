const express = require("express");
const router = express.Router();
const tmdbService = require("../services/tmdbService");

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// প্রতিটি ক্যাটাগরিতে ৩০ জন করে জেনুইন ইন্ডিয়ান অ্যাক্টরের আইডি লিস্ট
const STAR_IDS = {
  bollywood: [
    35742,   // Shah Rukh Khan
    52763,   // Salman Khan
    139534,  // Deepika Padukone
    1108120, // Alia Bhatt
    78749,   // Hrithik Roshan
    35743,   // Katrina Kaif
    178224,  // Ranbir Kapoor
    52736,   // Aamir Khan
    10814,   // Amitabh Bachchan
    35770,   // Akshay Kumar
    35745,   // Kareena Kapoor
    1120014, // Ranveer Singh
    35776,   // Ajay Devgn
    38940,   // Priyanka Chopra
    53139,   // Shahid Kapoor
    63513,   // Anushka Sharma
    1215160, // Kriti Sanon
    1042714, // Shraddha Kapoor
    5530,    // Aishwarya Rai Bachchan
    234135,  // Vicky Kaushal
    126743,  // Saif Ali Khan
    85729,   // Sanjay Dutt
    113941,  // John Abraham
    132431,  // Anil Kapoor
    102927,  // Maduri Dixit
    73420,   // Juhi Chawla
    85732,   // Kajol
    56736,   // Rani Mukerji
    61858,   // Preity Zinta
    1115783  // Kartik Aaryan
  ],
  tollywood: [
    55010,   // Prabhas
    108215,  // Allu Arjun
    73421,   // Samantha Ruth Prabhu
    147028,  // Rashmika Mandanna
    1699988, // Vijay Deverakonda
    63631,   // Ram Charan
    82248,   // Mahesh Babu
    113134,  // N.T. Rama Rao Jr.
    1323326, // Yash
    58000,   // Rajinikanth
    12053,   // Kamal Haasan
    142106,  // Dhanush
    119565,  // Suriya
    139626,  // Nayanthara
    122416,  // Trisha
    1530960, // Dulquer Salmaan
    1380064, // Fahadh Faasil
    162507,  // Nani
    146199,  // Rana Daggubati
    113171,  // Kajal Aggarwal
    144186,  // Tamannaah Bhatia
    1073860, // Anushka Shetty
    1373722, // Keerthy Suresh
    1318048, // Sai Pallavi
    1264227, // Rakshit Shetty
    1391583, // Rishab Shetty
    915234,  // Nivin Pauly
    1041935, // Tovino Thomas
    158102,  // Karthi
    931637   // Vijay Sethupathi
  ],
  tv: [
    1251144, // Kapil Sharma
    2352514, // Tejasswi Prakash
    1551068, // Shivangi Joshi
    1251148, // Hina Khan
    1395535, // Sunil Grover
    1243577, // Mouni Roy
    1787889, // Rupali Ganguly
    1443657, // Karan Kundrra
    1632766, // Shaheer Sheikh
    1322026, // Jennifer Winget
    1588661, // Divyanka Tripathi
    1912443, // Sriti Jha
    2161245, // Shraddha Arya
    2151631, // Dheeraj Dhoopar
    1709400, // Harshad Chopda
    1642220, // Erica Fernandes
    2244900, // Pranali Rathod
    1500366, // Nakuul Mehta
    2184179, // Ayesha Singh
    2011986, // Sumbul Touqeer
    1784941, // Rubina Dilaik
    2108741, // Nia Sharma
    60565,   // Ronit Roy
    1251141, // Shweta Tiwari
    1174620, // Divyenndu (Mirzapur/TV)
    1214041, // Karan Singh Grover
    1632764, // Sanaya Irani
    1712217, // Nakul Mehta
    574483,  // Sakshi Tanwar
    1243573  // Ram Kapoor
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
