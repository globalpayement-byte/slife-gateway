const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM passerelles ORDER BY id ASC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nom, operator, numero, imei } = req.body;
    const [result] = await pool.query(
      "INSERT INTO passerelles (nom, operator, numero, imei) VALUES (?, ?, ?, ?)",
      [nom, operator, numero, imei]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id/solde", async (req, res) => {
  try {
    const { solde } = req.body;
    await pool.query("UPDATE passerelles SET solde = ? WHERE id = ?", [solde, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id/statut", async (req, res) => {
  try {
    const { statut } = req.body;
    await pool.query("UPDATE passerelles SET statut = ? WHERE id = ?", [statut, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
