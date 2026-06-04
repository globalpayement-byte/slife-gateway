const { pool } = require("../config/database");

async function processSMS(operator, expediteur, corps, parsed) {
  // 1. Manavao ny solde passerelle (raha misy)
  if (parsed.solde !== null && parsed.solde !== undefined) {
    await pool.query(
      "UPDATE passerelles SET solde = ?, statut = 'connecte' WHERE operator = ? ORDER BY id ASC LIMIT 1",
      [parsed.solde, parsed.operator]
    );
  }

  // 2. Mitady transaction en_attente mifanaraka (montant + operator + type)
  const [orders] = await pool.query(
    `SELECT * FROM transactions
     WHERE statut = 'en_attente' AND operator = ? AND type = ? AND montant = ?
     ORDER BY created_at ASC LIMIT 1`,
    [parsed.operator, parsed.type, parsed.montant]
  );

  let transactionId = null;
  let matched = false;

  if (orders.length > 0) {
    // 3. MATCH — manamarina ny transaction
    transactionId = orders[0].id;
    matched = true;
    await pool.query(
      "UPDATE transactions SET statut = 'complete' WHERE id = ?",
      [transactionId]
    );
  }

  // 4. Mitahiry ny SMS (na matched na tsia)
  await pool.query(
    `INSERT INTO sms_recus
     (operator, expediteur, corps, montant, numero_client, trans_id, solde_apres, frais, type, transaction_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [parsed.operator, expediteur, corps, parsed.montant, parsed.numero_client || null,
     parsed.trans_id || null, parsed.solde, parsed.frais || 0, parsed.type, transactionId]
  );

  return { matched, transactionId };
}

module.exports = { processSMS };
