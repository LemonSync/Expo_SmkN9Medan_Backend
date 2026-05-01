const express = require("express");
const cors = require("cors");
const checkOutRoutes = require("../routes/checkOut");
const getTransaksi = require("../routes/getTransaksi");
const app = express();
const PORT = 5000; 

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({ response: "Ok", message: "Server API SMKN 9 Berjalan" })
});

app.use("/api/checkout", checkOutRoutes)
app.use("/api/get-transaksi", getTransaksi)

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

module.exports = app;