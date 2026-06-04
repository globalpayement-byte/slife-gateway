const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const { testConnection } = require("./config/database");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/sms", require("./routes/sms"));
app.use("/api/passerelles", require("./routes/passerelles"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SLife Gateway running on port ${PORT}`);
  testConnection();
});
