const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  // Language-aware cache key: "123_en", "123_hi"
  tmdbId: { type: String, required: true, unique: true },

  // TMDB থেকে পুরো ডিটেইলস অবজেক্ট
  details: { type: Object, required: true },

  // আপডেটেড Groq AI Analysis (এখানে তোমার ২য় কোডটি বসানো হয়েছে)
  aiAnalysis: {
    summary: String,
    story_blueprint: String,

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

  // YouTube media
  trailerId: String,
  playlist: [
    {
      id: String,
      title: String,
      thumbnail: String
    }
  ],

  // OTT / watch providers (TMDB থেকে)
  watchProviders: { type: Object },

  // UI meta badges
  meta: {
    isTrending: Boolean,
    isNew: Boolean,
    popularity: Number,
    imdbRating: Number,
    certification: String
  },

  // Cache timestamp
  lastUpdated: { type: Date, default: Date.now }

}, { minimize: false }); // খালি অবজেক্টও সেভ হবে

module.exports = mongoose.model('Movie', movieSchema);
