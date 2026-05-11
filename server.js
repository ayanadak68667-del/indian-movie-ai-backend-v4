require("express-async-errors");
require("dotenv").config();

require("./jobs/autoRefresh");

const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");

const personRoutes = require('./routes/person');

const app = express();

// ✅ Render বা অন্যান্য প্রক্সি সার্ভারের জন্য
app.set('trust proxy', 1);

// ✅ ENV validation
const requiredEnv = [
  "MONGO_URI",
  "TMDB_API_KEY",
  "GROQ_API_KEY",
  "GEMINI_API_KEY",
  "YOUTUBE_API_KEY",
  "ADMIN_SECRET"
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing ENV: ${key}`); // 👈 Backtick অ্যাড করা হয়েছে
    process.exit(1);
  }
});

// ✅ DB connect (safe)
connectDB().catch((err) => {
  console.error("❌ DB Connection Failed:", err.message);
  process.exit(1);
});

// ========================
// 🔐 SECURITY MIDDLEWARE
// ========================

// Helmet (security headers)
app.use(helmet());

// Mongo sanitize (prevent injection)
app.use(mongoSanitize());

// 🚀 SECURE & DYNAMIC CORS (Preview Fix)
const allowedOrigins = [
  "http://localhost:5173",
  "http://raatkibaat.in",
  "https://raatkibaat.in",
  "http://www.raatkibaat.in",
  "https://www.raatkibaat.in"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // ✅ Mobile apps / Postman support  
      if (!origin) return callback(null, true);  

      // ✅ Hostinger Preview + Localhost support  
      if (  
        origin.includes("hostinger.com") ||  
        origin.includes("hostingerapp.com") ||  
        origin.includes("localhost")  
      ) {  
        return callback(null, true);  
      }  

      // ✅ Main domain allow  
      if (allowedOrigins.indexOf(origin) !== -1) {  
        return callback(null, true);  
      }  

      // ❌ Block others  
      return callback(new Error("CORS Policy Error: Origin not allowed"));  
    },  
    credentials: true
  })
);

// ========================
// ⚡ PERFORMANCE MIDDLEWARE
// ========================

// Compression
app.use(compression());

// Logger
app.use(morgan("dev"));

// Body parser (limit added)
app.use(express.json({ limit: "10kb" }));

// ========================
// 🚦 RATE LIMIT
// ========================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later."
  }
});

app.use(limiter);

// ========================
// ❤️ HEALTH CHECK
// ========================

app.get("/", (req, res) => {
  res.send("Filmi Bharat API is running 🚀");
});

// ========================
// 📦 ROUTES
// ========================

app.use("/api/movies", require("./routes/movie"));
app.use("/api/ai-chat", require("./routes/aiChat"));
app.use("/api/home", require("./routes/home"));
app.use("/api/admin", require("./routes/admin"));
app.use('/api/person', personRoutes);
app.use("/api/anime", require("./routes/anime"));

// ========================
// ❌ GLOBAL ERROR HANDLER
// ========================

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error"
  });
});

// ========================
// 🚀 SERVER START
// ========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Filmi Bharat Backend Live on ${PORT}`); // 👈 Backtick অ্যাড করা হয়েছে
});
