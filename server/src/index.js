const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const { testConnection } = require("./config/database");
const { requireApiKey } = require("./middleware/auth");

const app = express();

// Behind Cloudflare / reverse-proxy: ilaina mba marina ny IP amin'ny rate-limit
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "64kb" }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600 });
app.use(limiter);

// /health: misokatra (tsy mila key) — ho an'ny monitoring/uptime check
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// Ny /api rehetra dia mitaky API key manan-kery (x-api-key)
app.use("/api/transactions", requireApiKey, require("./routes/transactions"));
app.use("/api/sms", requireApiKey, require("./routes/sms"));
app.use("/api/passerelles", requireApiKey, require("./routes/passerelles"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SLife Gateway running on port ${PORT}`);
  testConnection();
});
