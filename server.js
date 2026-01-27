const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/movies', require('./routes/movie'));
app.use('/api/ai-chat', require('./routes/aiChat'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Filmi Bharat Backend Live on ${PORT}`));
