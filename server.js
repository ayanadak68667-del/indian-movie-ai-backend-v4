const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const app = express();

// DB connect
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('Filmi Bharat API is running 🚀');
});

// Routes
app.use('/api/movies', require('./routes/movie'));
app.use('/api/ai-chat', require('./routes/aiChat'));
app.use("/api/home", require("./routes/home"));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => 
  console.log(`🚀 Filmi Bharat Backend Live on ${PORT}`)
);
