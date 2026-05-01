const express = require("express");
const cors = require("cors");
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// Import pool database
const pool = require('../db/connection'); 

// Import Routes
const apiRoutes = require('../routes/apiGame');
const checkOutRoutes = require("../routes/checkOut");
const getTransaksi = require("../routes/getTransaksi");

const app = express();

// 1. Trust Proxy (Wajib buat Vercel agar cookie session bisa lewat via HTTPS)
app.set('trust proxy', 1);

// 2. Konfigurasi MySQL Store untuk Session
// Menambahkan createDatabaseTable: true agar otomatis buat tabel 'sessions' jika belum ada
const sessionStore = new MySQLStore({
    createDatabaseTable: true,
    schema: {
        tableName: 'sessions'
    }
}, pool);

// 3. CORS Configuration
// Menambahkan origin localhost dan handle preflight secara global
const allowedOrigins = [
    "http://localhost:5173", 
    "http://localhost:3000", 
    "http://127.0.0.1:5173",
    "https://lemon-expo-frontend.vercel.app" // Ganti dengan URL frontend Vercel lo
];

app.use(cors({
    origin: function (origin, callback) {
        // Izinkan request tanpa origin (seperti mobile apps atau curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// FIXED: Penanganan Preflight request untuk Vercel (Ganti * jadi (.*))
app.options("(.*)", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Session Middleware
app.use(session({
    key: 'math_game_session',
    secret: process.env.SESSION_SECRET || 'game-math-secret-key', 
    store: sessionStore, 
    resave: false,
    saveUninitialized: false, 
    cookie: { 
        // Wajib true saat di Vercel (HTTPS)
        secure: process.env.NODE_ENV === "production", 
        // Wajib 'none' jika frontend dan backend beda domain (Cross-site)
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', 
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

// FIXED: 404 Handler (Ganti * jadi (.*) atau biarkan tanpa path)
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

// Port handler (Vercel menggunakan process.env.PORT secara internal)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server jalan lokal di port ${PORT}`);
    });
}

module.exports = app;