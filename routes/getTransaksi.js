const express = require("express");
const router = express.Router();
const db = require("../db/connection");
require('dotenv').config();
const DASH_PASSWORD = process.env.DASH_PASSWORD || "AkuSuges"

const checkAdminPass = (req, res, next) => {
    const pass = req.query.pass || req.body.pass;

    if (!pass || pass !== DASH_PASSWORD) {
        return res.status(401).json({ message: "Akses Ditolak: Password Salah" });
    }
    next();
};


router.get('/', checkAdminPass, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM orders ORDER BY tanggal DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.patch('/:id', checkAdminPass, async (req, res) => {
    const { id } = req.params;
    const { selesai } = req.body;
    
    try {
        await db.execute('UPDATE orders SET selesai = ? WHERE id = ?', [selesai, id]);
        res.json({ success: true, message: "Status diperbarui" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;