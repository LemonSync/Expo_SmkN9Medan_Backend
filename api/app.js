const express = require("express");
const cors = require("cors");
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// Import pool database lo dari config
const pool = require('./config/db'); 

// Import Routes
const apiRoutes = require('../routes/apiGame');
const checkOutRoutes = require("../routes/checkOut");
const getTransaksi = require("../routes/getTransaksi");

const app = express();

// 1. Trust Proxy (Wajib buat Vercel agar cookie session bisa lewat)
app.set('trust proxy', 1);

// 2. Konfigurasi MySQL Store untuk Session
const sessionStore = new MySQLStore({}, pool);

// 3. CORS Configuration
// Sesuaikan origin dengan URL frontend Vercel lo nanti
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", 
    credentials: true // Wajib true agar session cookie bisa terkirim/diterima
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Session Middleware
app.use(session({
    key: 'math_game_session',
    secret: 'game-math-secret-key', // Ganti dengan string random di .env
    store: sessionStore, 
    resave: false,
    saveUninitialized: false, // Set false agar tidak membuat session kosong
    cookie: { 
        secure: process.env.NODE_ENV === "production", // True jika di Vercel (HTTPS)
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', // Biar nggak kena block browser
        maxAge: 1000 * 60 * 60 * 24 // 1 hari
    }
}));

// --- Routes ---
app.get("/", (req, res) => {
    res.status(200).json({ response: "Ok", message: "Server API SMKN 9 Berjalan" })
});

app.use('/api/game', apiRoutes);
app.use("/api/ecommerce/checkout", checkOutRoutes);
app.use("/api/ecommerce/get-transaksi", getTransaksi);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

// Port handler (Vercel biasanya pakai process.env.PORT)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server jalan lokal di port ${PORT}`);
    });
}

module.exports = app;