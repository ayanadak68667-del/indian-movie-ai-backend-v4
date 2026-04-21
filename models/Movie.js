const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    // 🔑 Cache Key (indexed + unique)
    tmdbId: {
      type: String,
      required: true,
      unique: true,
      // index: true (unique: true থাকলে আলাদা করে index দরকার নেই)
    },

    details: {
      type: Object,
      required: true
    },

    aiAnalysis: {
      summary: { type: String, default: "" },
      story_blueprint: { type: String, default: "" },
      performance_spotlight: [
        {
          actor: String,
          role: String,
          description: String
        }
      ],
      behind_the_scenes: [String],
      hits: [String],
      misses: [String],
      data_deep_dive: {
        budget: String,
        box_office: String,
        verdict: String
      },
      star_paychecks: [
        {
          actor: String,
          role: String,
          estimated_salary: String
        }
      ],
      credits: {
        director: String,
        box_office: String
      },
      // ✅ আমরা আগের আলোচনায় যে missing field টি পেয়েছিলাম সেটি এখানে অ্যাড করে দিলাম
      who_should_watch: {
        horror_lovers: { type: Number, default: 0 },
        critics: { type: Number, default: 0 },
        mass_audience: { type: Number, default: 0 }
      }
    },

    trailerId: { type: String, default: "" },
    playlist: [
      {
        id: String,
        title: String,
        thumbnail: String
      }
    ],

    watchProviders: {
      type: Object,
      default: {}
    },

    meta: {
      isTrending: { type: Boolean, default: false },
      isNew: { type: Boolean, default: false },
      popularity: { type: Number, default: 0 },
      imdbRating: { type: Number, default: 0 },
      certification: { type: String, default: "" }
    },

    // ⏳ Cache Timestamp
    lastUpdated: {
      type: Date,
      default: Date.now
      // 🚀 এখান থেকে index: true সরিয়ে ফেলা হয়েছে কারণ নিচে TTL Index আছে
    }
  },
  {
    minimize: false,
    timestamps: true 
  }
);

// 🚀 TTL Index (এটি ৭ দিন পর ডেটা অটো ডিলিট করবে এবং এটাই একমাত্র ইনডেক্স হবে lastUpdated এর জন্য)
movieSchema.index(
  { lastUpdated: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 7 }
);

module.exports = mongoose.model("Movie", movieSchema);
