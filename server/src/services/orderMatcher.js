const { pool } = require("../config/database");

/**
 * Mikarakara SMS iray ao anatin'ny DB transaction atomique.
 *
 * Antoka:
 *  - Idempotent: ny `message_id` dia UNIQUE. Raha tonga indroa ny SMS (retry),
 *    ny fanindroany dia tsapaina ho duplicate (ER_DUP_ENTRY) ka tsy averina
 *    kajiana — tsy very, tsy avo roa heny ny solde.
 *  - Atomique: ny fanavaozana solde + match order + fitahirizana SMS dia
 *    iray transaction. Raha misy tsy mety → ROLLBACK manontolo.
 *  - Tsy misy race: ny order mifanaraka dia alaina amin'ny SELECT ... FOR UPDATE
 *    ka tsy azon'ny SMS roa miaraka ny order iray ihany.
 *
 * @returns {Promise<{matched:boolean, transactionId:number|null, duplicate:boolean}>}
 */
async function processSMS({ messageId, operator, expediteur, corps, parsed }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let transactionId = null;
    let matched = false;
    const isParsed = parsed && parsed.success;

    if (isParsed) {
      // 1. Manavao ny solde passerelle (raha misy ao amin'ny SMS)
      if (parsed.solde !== null && parsed.solde !== undefined) {
        await conn.query(
          "UPDATE passerelles SET solde = ?, statut = 'connecte' WHERE operator = ? ORDER BY id ASC LIMIT 1",
          [parsed.solde, parsed.operator]
        );
      }

      // 2. Mitady transaction en_attente mifanaraka + LOCK (FOR UPDATE)
      const [orders] = await conn.query(
        `SELECT id FROM transactions
         WHERE statut = 'en_attente' AND operator = ? AND type = ? AND montant = ?
         ORDER BY created_at ASC LIMIT 1
         FOR UPDATE`,
        [parsed.operator, parsed.type, parsed.montant]
      );

      if (orders.length > 0) {
        transactionId = orders[0].id;
        matched = true;
        await conn.query(
          "UPDATE transactions SET statut = 'complete' WHERE id = ?",
          [transactionId]
        );
      }
    }

    // 3. Mitahiry ny SMS (na parsed na tsia) miaraka amin'ny message_id tokana
    await conn.query(
      `INSERT INTO sms_recus
       (message_id, operator, expediteur, corps, montant, numero_client, trans_id, solde_apres, frais, type, transaction_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        messageId,
        isParsed ? parsed.operator : operator || null,
        expediteur || null,
        corps,
        isParsed ? parsed.montant : null,
        isParsed ? parsed.numero_client || null : null,
        isParsed ? parsed.trans_id || null : null,
        isParsed ? parsed.solde : null,
        isParsed ? parsed.frais || 0 : 0,
        isParsed ? parsed.type : "autre",
        transactionId,
      ]
    );

    await conn.commit();
    return { matched, transactionId, duplicate: false };
  } catch (err) {
    await conn.rollback();
    // Duplicate message_id → retry tonga indroa → tsapaina fa efa voaray
    if (err.code === "ER_DUP_ENTRY") {
      return { matched: false, transactionId: null, duplicate: true };
    }
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { processSMS };
