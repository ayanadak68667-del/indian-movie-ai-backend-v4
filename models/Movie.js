const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    tmdbId: { type: String, required: true, unique: true }, // এটি হবে "id_lang" (উদা: 736039_hi)
    details: { type: Object, required: true },
    aiAnalysis: {
        hits: [String],
        misses: [String],
        paychecks: [{ actor: String, role: String, estimated_salary: String }],
        bts: [String]
    },
    media: {
        trailerId: String,
        playlist: Array
    },
    createdAt: { type: Date, default: Date.now, expires: '30d' } 
});

module.exports = mongoose.model('Movie', movieSchema);
