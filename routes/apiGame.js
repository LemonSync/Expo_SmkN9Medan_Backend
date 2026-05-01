const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const game = require('../controllers/gameController');

// Auth Routes
router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/logout', auth.logout);

// Game Routes
router.get('/question', game.generateQuestion);
router.get('/rankings', game.getRankings);
// router.post('/submit', game.submitAnswer); // Buat logic submitAnswer mirip dengan generate

module.exports = router;