require("dotenv").config({ path: require("path").resolve(__dirname, "../.env.local") });
const express = require("express");
const cors = require("cors");
const analyzeRouter = require("./routes/analyze");

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: true,
    credentials: false,
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/analyze", analyzeRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Unexpected error";
  res.status(status).json({ error: message });
});

app.listen(port, () => {
  process.stdout.write(`Catty backend listening on http://localhost:${port}\n`);
});
