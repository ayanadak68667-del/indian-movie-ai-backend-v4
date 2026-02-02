const mongoose = require("mongoose");
console.log("✅ HomeCache model loaded");

const homeCacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  data: {
    type: Object,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("HomeCache", homeCacheSchema);
