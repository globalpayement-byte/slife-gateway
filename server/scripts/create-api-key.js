#!/usr/bin/env node
// Mamorona API key vaovao ary mitahiry azy ao amin'ny base.
// Fampiasana:  node scripts/create-api-key.js "anaran'ny key"
const crypto = require("crypto");
const { pool } = require("../src/config/database");

async function main() {
  const nom = process.argv[2] || "default";
  const cle = "slk_" + crypto.randomBytes(24).toString("hex");
  await pool.query("INSERT INTO api_keys (nom, cle, actif) VALUES (?, ?, TRUE)", [nom, cle]);
  console.log("API key noforonina:");
  console.log("  nom :", nom);
  console.log("  cle :", cle);
  console.log("\nAmpiasao amin'ny header:  x-api-key: " + cle);
  await pool.end();
}

main().catch((err) => {
  console.error("Tsy nahomby:", err.message);
  process.exit(1);
});
