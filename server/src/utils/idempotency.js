const crypto = require("crypto");

/**
 * Mamorona fanalahidy tokana (idempotency key) isaky ny SMS fisika.
 *
 * Laharam-pahamehana:
 *   1. message_id nomen'ny mpandefa (tena tsara indrindra — ohatra ny _id sy
 *      timestamp omen'i Android isaky ny SMS). Mihazona stable na dia averina
 *      alefa aza ilay SMS.
 *   2. trans_id voasoratra anatin'ny corps (Trans Id / Ref / Id) — tokana isaky
 *      ny transaction mobile money.
 *   3. Hash (sha256) an'ny expediteur + corps — vahaolana farany.
 *
 * Izany no manao azo antoka fa ny "retry" ataon'ny mpandefa dia tsy hamerina
 * hikajy ny SMS efa voaray.
 */
function buildMessageId({ message_id, trans_id, expediteur, corps }) {
  if (message_id && String(message_id).trim()) {
    return String(message_id).trim().slice(0, 190);
  }
  if (trans_id && String(trans_id).trim()) {
    return `trans:${String(trans_id).trim()}`.slice(0, 190);
  }
  const hash = crypto
    .createHash("sha256")
    .update(`${expediteur || ""}|${corps || ""}`)
    .digest("hex");
  return `sha:${hash}`;
}

module.exports = { buildMessageId };
