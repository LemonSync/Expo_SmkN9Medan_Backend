const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const gameController = require('../controllers/gameController');

/**
 * MIDDLEWARE: Cek Login
 * Fungsi ini akan berjalan sebelum masuk ke logika game.
 * Kalau user belum login, langsung ditolak di sini.
 */
const isAdmin = (req, res, next) => {
    if (req.session.user_id) {
        next(); // Lanjut ke fungsi berikutnya
    } else {
        res.status(401).json({ 
            status: 'error', 
            message: 'Unauthorized: Silakan login terlebih dahulu' 
        });
    }
};

// --- AUTH ROUTES ---
// URL: /api/register
router.post('/register', authController.register);

// URL: /api/login
router.post('/login', authController.login);

// URL: /api/logout
router.get('/logout', authController.logout);

// URL: /api/check-auth (Opsional, buat ngecek status di frontend)
router.get('/check-auth', authController.checkStatus);


// --- GAME ROUTES (Semua diproteksi middleware 'isAdmin') ---

// URL: /api/question (Ganti dari generate-question.php)
router.get('/question', isAdmin, gameController.generateQuestion);

// URL: /api/submit (Ganti dari submit-answer.php)
router.post('/submit', isAdmin, gameController.submitAnswer);

// URL: /api/rankings (Ganti dari get-score.php)
router.get('/rankings', gameController.getRankings); // Ranking biasanya boleh dilihat tanpa login

module.exports = router;