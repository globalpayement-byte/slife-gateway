const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { parseSMS } = require("../services/smsParser");
const { processSMS } = require("../services/orderMatcher");
const { buildMessageId } = require("../utils/idempotency");

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
    const { expediteur, corps, message_id } = req.body;
    if (!corps) return res.status(400).json({ success: false, error: "Tsy misy corps SMS" });

    const parsed = parseSMS(corps);

    // Fanalahidy tokana isaky ny SMS — manao azo antoka ny "retry"
    const messageId = buildMessageId({
      message_id,
      trans_id: parsed.success ? parsed.trans_id : null,
      expediteur,
      corps,
    });

    // Dedup mialoha: raha efa voaray io SMS io → averina ny valiny taloha (200)
    const [existing] = await pool.query(
      "SELECT operator, type, montant, transaction_id FROM sms_recus WHERE message_id = ?",
      [messageId]
    );
    if (existing.length > 0) {
      const prev = existing[0];
      return res.json({
        success: true,
        duplicate: true,
        parsed: prev.type !== "autre",
        operator: prev.operator,
        type: prev.type,
        montant: prev.montant,
        matched: prev.transaction_id !== null,
        transaction_id: prev.transaction_id,
        message: "SMS efa voaray (idempotent)",
      });
    }

    const result = await processSMS({
      messageId,
      operator: parsed.success ? parsed.operator : null,
      expediteur,
      corps,
      parsed,
    });

    // Race: SMS roa mitovy tonga miaraka → ny faharoa duplicate
    if (result.duplicate) {
      return res.json({
        success: true,
        duplicate: true,
        message: "SMS efa voaray (idempotent)",
      });
    }

    if (!parsed.success) {
      return res.json({
        success: true,
        parsed: false,
        message: "SMS tsy fantatra, voatahiry",
      });
    }

    res.json({
      success: true,
      parsed: true,
      operator: parsed.operator,
      type: parsed.type,
      montant: parsed.montant,
      matched: result.matched,
      transaction_id: result.transactionId,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
