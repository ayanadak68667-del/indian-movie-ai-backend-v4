const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// মুভি আইডি দিয়ে ডিটেইলস পাওয়ার রাউট
router.get('/:id', movieController.getMovieDetailsPage);

module.exports = router;
