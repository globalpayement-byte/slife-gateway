const { pool } = require("../config/database");

// Cache kely (60s) mba tsy hanontany ny base isaky ny requête
const CACHE_TTL_MS = 60 * 1000;
let cache = { keys: new Set(), expires: 0 };

async function loadKeys() {
  const [rows] = await pool.query("SELECT cle FROM api_keys WHERE actif = TRUE");
  cache = {
    keys: new Set(rows.map((r) => r.cle)),
    expires: Date.now() + CACHE_TTL_MS,
  };
  return cache.keys;
}

/**
 * Middleware mitaky API key manan-kery ao amin'ny header `x-api-key`.
 * Ilaina eo amin'ny VPS public mba tsy hisy SMS sandoka tafiditra.
 */
async function requireApiKey(req, res, next) {
  try {
    const provided = req.get("x-api-key");
    if (!provided) {
      return res.status(401).json({ success: false, error: "API key tsy misy (x-api-key)" });
    }
    let keys = cache.keys;
    if (Date.now() > cache.expires) {
      keys = await loadKeys();
    }
    // Raha tsy hita ao amin'ny cache, manavao indray mandeha (sao vao ampiana)
    if (!keys.has(provided)) {
      keys = await loadKeys();
    }
    if (!keys.has(provided)) {
      return res.status(403).json({ success: false, error: "API key tsy manan-kery" });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { requireApiKey };
