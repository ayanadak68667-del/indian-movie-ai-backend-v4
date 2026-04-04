require("express-async-errors");
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");

const app = express();

// ✅ ENV validation
const requiredEnv = [
  "MONGO_URI",
  "TMDB_API_KEY",
  "GROQ_API_KEY",
  "GEMINI_API_KEY",
  "YOUTUBE_API_KEY"
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing ENV: ${key}`);
    process.exit(1);
  }
});

// DB connect
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  })
);

// Health check
app.get("/", (req, res) => {
  res.send("Filmi Bharat API is running 🚀");
});

// Routes
app.use("/api/movies", require("./routes/movie"));
app.use("/api/ai-chat", require("./routes/aiChat"));
app.use("/api/home", require("./routes/home"));
app.use("/api/admin", require("./routes/admin"));

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Filmi Bharat Backend Live on ${PORT}`);
});
