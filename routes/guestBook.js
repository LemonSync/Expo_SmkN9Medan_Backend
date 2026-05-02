// routes/guestbook.js
const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Ambil data pengunjung
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM guest_book ORDER BY tanggal DESC');
        res.json(rows);
    } catch (err) { res.status(500).json(err); }
});

// Simpan pesan baru
router.post('/', async (req, res) => {
    const { nama, pesan, instansi } = req.body;
    try {
        await db.execute('INSERT INTO guest_book (nama, pesan, instansi) VALUES (?, ?, ?)', [nama, pesan, instansi]);
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

module.exports = router;
