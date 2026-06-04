const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { parseSMS } = require("../services/smsParser");
const { processSMS } = require("../services/orderMatcher");

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM sms_recus ORDER BY recu_at DESC LIMIT 100");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { expediteur, corps } = req.body;
    if (!corps) return res.status(400).json({ success: false, error: "Tsy misy corps SMS" });

    const parsed = parseSMS(corps);

    if (!parsed.success) {
      await pool.query(
        "INSERT INTO sms_recus (operator, expediteur, corps, type) VALUES (?, ?, ?, ?)",
        ["mvola", expediteur || null, corps, "autre"]
      );
      return res.json({ success: true, parsed: false, message: "SMS tsy fantatra, voatahiry" });
    }

    const result = await processSMS(parsed.operator, expediteur, corps, parsed);

    res.json({
      success: true,
      parsed: true,
      operator: parsed.operator,
      type: parsed.type,
      montant: parsed.montant,
      matched: result.matched,
      transaction_id: result.transactionId
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
