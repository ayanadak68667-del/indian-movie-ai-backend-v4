const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  // language-aware cache key: "123_en", "123_hi"
  tmdbId: { type: String, required: true, unique: true },

  // TMDB থেকে পুরো ডিটেইলস অবজেক্ট
  details: { type: Object, required: true },

  // Groq AI analysis
  aiAnalysis: {
    hits: [String],
    misses: [String],
    paychecks: [
      {
        actor: String,
        role: String,
        estimated_salary: String
      }
    ],
    bts: [String]
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

  // cache timestamp
  lastUpdated: { type: Date, default: Date.now }

}, { minimize: false }); // খালি অবজেক্টও সেভ হবে

module.exports = mongoose.model('Movie', movieSchema);
