
const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    // 🔑 Cache Key (indexed + unique)
    tmdbId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // 🎬 TMDB Data (flexible but controlled)
    details: {
      type: Object,
      required: true
    },

    // 🤖 AI Analysis
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
      }
    },

    // 🎥 YouTube media
    trailerId: { type: String, default: "" },

    playlist: [
      {
        id: String,
        title: String,
        thumbnail: String
      }
    ],

    // 📺 OTT Providers
    watchProviders: {
      type: Object,
      default: {}
    },

    // 📊 UI Meta
    meta: {
      isTrending: { type: Boolean, default: false },
      isNew: { type: Boolean, default: false },
      popularity: { type: Number, default: 0 },
      imdbRating: { type: Number, default: 0 },
      certification: { type: String, default: "" }
    },

    // ⏳ Cache Timestamp (indexed)
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    minimize: false,
    timestamps: true // 🔥 createdAt + updatedAt
  }
);

// 🚀 Optional TTL Index (auto delete after 7 days)
movieSchema.index(
  { lastUpdated: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 7 }
);

module.exports = mongoose.model("Movie", movieSchema);
