const express = require("express");
const cors = require("cors");
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('../db/connection'); 
const apiRoutes = require('../routes/apiGame');
const checkOutRoutes = require("../routes/checkOut");
const getTransaksi = require("../routes/getTransaksi");
const guestBook = require("../routes/guestBook");

const app = express();

app.set('trust proxy', 1);

const sessionStore = new MySQLStore({
    createDatabaseTable: true,
    schema: { tableName: 'sessions' }
}, pool);

const allowedOrigins = [
    "http://localhost:5173", 
    "http://localhost:3000", 
    "http://127.0.0.1:5173",
    "https://expo-smkn9medan.vercel.app"
];

// Middleware CORS Utama
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    key: 'math_game_session',
    secret: process.env.SESSION_SECRET || 'game-math-secret-key', 
    store: sessionStore, 
    resave: false,
    saveUninitialized: false, 
    cookie: { 
        secure: process.env.NODE_ENV === "production", 
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', 
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

// Route Utama
app.get("/", (req, res) => {
    res.status(200).json({ response: "Ok", message: "Server API SMKN 9 Berjalan" })
});

// --- ENDPOINT DARURAT HAPUS DATA ---
// Akses: GET /api/ecommerce/guest-book/emergency-clear-all
app.get("/api/ecommerce/guest-book/emergency-clear-all", async (req, res) => {
    try {
        // Menggunakan pool.query atau pool.execute untuk mengosongkan tabel
        await pool.query("TRUNCATE TABLE guest_book");
        
        res.status(200).json({
            success: true,
            message: "DARURAT: Semua data di tabel guest_book berhasil dihapus (Reset ID ke 1)."
        });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal menghapus data: " + error.message
        });
    }
});
// -----------------------------------

app.use('/api/game', apiRoutes);
app.use("/api/ecommerce/checkout", checkOutRoutes);
app.use("/api/ecommerce/get-transaksi", getTransaksi);
app.use("/api/ecommerce/guest-book", guestBook);

// REPAIR: 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server jalan lokal di port ${PORT}`);
    });
}

module.exports = app;
