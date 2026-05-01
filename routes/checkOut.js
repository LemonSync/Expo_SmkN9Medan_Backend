const express = require("express");
const router = express.Router();
const db = require("../db/connection");

router.post("/", async (req, res) => {
  const { customer_name, customer_phone, total_price, order_items } = req.body;

  if (!customer_name || !customer_phone || !order_items) {
    return res.status(400).json({
      success: false,
      message: "Data tidak lengkap (Nama, NoHP, atau Item kosong).",
    });
  }

  try {
    const sql = `INSERT INTO orders (nama, nohp, items_json, total_harga, selesai) VALUES (?, ?, ?, ?, ?)`;

    const [result] = await db.execute(sql, [
      customer_name,
      customer_phone,
      order_items,
      total_price,
      false
    ]);

    res.status(201).json({
      success: true,
      message: "Pesanan berhasil dicatat ke database!",
      orderId: result.insertId,
    });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan data ke server.",
      error: error.message,
    });
  }
});

module.exports = router;
