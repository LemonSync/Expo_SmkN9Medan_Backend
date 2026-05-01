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

// REPAIR: Gunakan middleware tanpa path untuk menangani OPTIONS secara global
// Ini akan menghindari error "path-to-regexp"
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

app.get("/", (req, res) => {
    res.status(200).json({ response: "Ok", message: "Server API SMKN 9 Berjalan" })
});

app.use('/api/game', apiRoutes);
app.use("/api/ecommerce/checkout", checkOutRoutes);
app.use("/api/ecommerce/get-transaksi", getTransaksi);
app.use("/api/ecommerce/guest-book", guestBook);

// REPAIR: 404 Handler tanpa string path '*' atau '(.*)'
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