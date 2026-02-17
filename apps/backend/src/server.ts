import express from "express";
import apiKeyRoutes from "./routes/apiKey";
import eventRoutes from "./routes/events";

const app = express();


app.use(express.json());
app.use(apiKeyRoutes);
app.use(eventRoutes);

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Trading API",
    endpoints: {
      "GET /": "This message",
      "GET /health": "Health check",
      "POST /api/keys": "Create API key (body: { accountId })",
    },
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "running" });
});

// API routes


const PORT = 4001;

app.listen(PORT, () => {
  console.log("");
  console.log(`Backend running on port ${PORT}`);
  console.log(`  http://localhost:${PORT}/`);
  console.log(`  http://localhost:${PORT}/health`);
  console.log(`  http://localhost:${PORT}/api/keys (POST)`);
  console.log("");
});
