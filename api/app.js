const express = require("express");
const cors = require("cors");
const checkOutRoutes = require("../routes/checkOut");
const getTransaksi = require("../routes/getTransaksi");
const session = require('express-session');
const apiRoutes = require('../routes/apiGame');
const app = express();
const PORT = 5000; 

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'game-math-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set true kalau pakai HTTPS
}));

app.get("/", (req, res) => {
    res.status(200).json({ response: "Ok", message: "Server API SMKN 9 Berjalan" })
});

app.use('/api/game', apiRoutes);
app.use("/api/ecommerce/checkout", checkOutRoutes)
app.use("/api/ecommerce/get-transaksi", getTransaksi)

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

module.exports = app;