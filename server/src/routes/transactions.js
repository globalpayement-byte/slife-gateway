const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 100");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { type, montant, numero_client, operator, api_source } = req.body;
    const order_id = "ORD-" + Date.now();
    const [result] = await pool.query(
      "INSERT INTO transactions (order_id, type, montant, numero_client, operator, api_source) VALUES (?, ?, ?, ?, ?, ?)",
      [order_id, type, montant, numero_client, operator, api_source]
    );
    res.json({ success: true, order_id, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:order_id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM transactions WHERE order_id = ?", [req.params.order_id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: "Tsy hita" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
