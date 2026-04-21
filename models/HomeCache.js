
const mongoose = require("mongoose");

const homeCacheSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    // 🔥 TTL based on lastUpdated (NOT createdAt)
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// ⏱️ TTL index (24h auto delete)
homeCacheSchema.index(
  { lastUpdated: 1 },
  { expireAfterSeconds: 60 * 60 * 24 }
);

// 🛡️ Prevent OverwriteModelError
module.exports =
  mongoose.models.HomeCache ||
  mongoose.model("HomeCache", homeCacheSchema);
