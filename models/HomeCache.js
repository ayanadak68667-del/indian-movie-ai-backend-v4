const mongoose = require("mongoose");

const homeCacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 // ⏱️ 24 hours TTL
  }
});

// 🛡️ Prevent OverwriteModelError (VERY IMPORTANT)
module.exports =
  mongoose.models.HomeCache ||
  mongoose.model("HomeCache", homeCacheSchema);
