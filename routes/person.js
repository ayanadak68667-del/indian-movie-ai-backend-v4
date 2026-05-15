const express = require("express");
const router = express.Router();
const tmdbService = require("../services/tmdbService");

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// ১️⃣ হোমপেজের জন্য পপুলার ইন্ডিয়ান স্টারদের লিস্ট (Bollywood & Tollywood)
router.get("/trending-stars", (req, res) => {
  const stars = {
    bollywood: [
      { id: 35742, name: "Shah Rukh Khan", image: `${IMAGE_BASE}/n8VOWPAP6jI7wDnf4R3x1DneA5z.jpg` },
      { id: 139534, name: "Deepika Padukone", image: `${IMAGE_BASE}/vL8X5Kvl7QnLz8Yg51nZOT2u4Yq.jpg` },
      { id: 52763, name: "Salman Khan", image: `${IMAGE_BASE}/iwWm1A3eHUPZzVw5KxV2a84YF5u.jpg` },
      { id: 1108120, name: "Alia Bhatt", image: `${IMAGE_BASE}/2kS13h7b5T1bJ8Btzg01v61h5K8.jpg` },
      { id: 78749, name: "Hrithik Roshan", image: `${IMAGE_BASE}/jR2NigXwP1xQz8eC6t4V6aUEXmE.jpg` }
    ],
    tollywood: [
      { id: 73968, name: "Allu Arjun", image: `${IMAGE_BASE}/nJm7hEEQoQnOvvz71MIn3bNqX5R.jpg` },
      { id: 73421, name: "Samantha Ruth Prabhu", image: `${IMAGE_BASE}/vGk4tN6uSMy68pZt14b0Y5MhO4c.jpg` },
      { id: 55010, name: "Prabhas", image: `${IMAGE_BASE}/vBwR27l28Y7JdZJIt25n3Yy9U9H.jpg` },
      { id: 147028, name: "Rashmika Mandanna", image: `${IMAGE_BASE}/5sU2B1mK8H6T4L8H41qP90M03R1.jpg` },
      { id: 63631, name: "Ram Charan", image: `${IMAGE_BASE}/4mB38M8j667UqYfGf1T0N1w8aQo.jpg` }
    ]
  };
  res.json({ success: true, data: stars });
});

// ⭐ Bollywood Stars
router.get("/bollywood-stars", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 35742,
        name: "Shah Rukh Khan",
        profile_path: "/n8VOWPAP6jI7wDnf4R3x1DneA5z.jpg"
      },
      {
        id: 1108120,
        name: "Alia Bhatt",
        profile_path: "/2kS13h7b5T1bJ8Btzg01v61h5K8.jpg"
      },
      {
        id: 52763,
        name: "Salman Khan",
        profile_path: "/iwWm1A3eHUPZzVw5KxV2a84YF5u.jpg"
      }
    ]
  });
});

// ⭐ Tollywood Stars
router.get("/tollywood-stars", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 55010,
        name: "Prabhas",
        profile_path: "/vBwR27l28Y7JdZJIt25n3Yy9U9H.jpg"
      },
      {
        id: 73968,
        name: "Allu Arjun",
        profile_path: "/nJm7hEEQoQnOvvz71MIn3bNqX5R.jpg"
      },
      {
        id: 73421,
        name: "Samantha Ruth Prabhu",
        profile_path: "/vGk4tN6uSMy68pZt14b0Y5MhO4c.jpg"
      }
    ]
  });
});

// ⭐ TV Celebrities
router.get("/tv-celebrities", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 12345,
        name: "Kapil Sharma",
        profile_path: "/test.jpg"
      },
      {
        id: 12346,
        name: "Tejasswi Prakash",
        profile_path: "/test2.jpg"
      }
    ]
  });
});

// ২️⃣ অ্যাক্টরের ডিটেইলস এবং তার মুভি লিস্ট (Actor Profile Page-এর জন্য)
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

    // মুভি লিস্ট সর্টিং করা (সবচেয়ে জনপ্রিয় মুভিগুলো আগে দেখানোর জন্য)
    let works = credits?.cast || [];
    works = works
      .filter(w => w.poster_path) // যেসব মুভির পোস্টার আছে শুধু সেগুলো নেব
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 30); // সেরা ৩০টি মুভি/সিরিজ

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
