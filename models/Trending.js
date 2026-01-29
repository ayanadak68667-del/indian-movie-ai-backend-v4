const mongoose = require('mongoose');

const trendingSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['trending_indian', 'upcoming_indian', 'top_rated_indian'] 
  },
  data: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trending', trendingSchema);
