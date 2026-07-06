import "dotenv/config";
import cors from "cors";
import express from "express";
import { jwtAuthMiddleware } from "./middleware/jwtAuth.js";
import aiRoutes from "./routes/ai.js";
import { getLlmStatus } from "./services/llm/provider.js";

const app = express();
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 5001);
const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin }));
app.use(express.json());
app.use(jwtAuthMiddleware);

app.get("/health", (_req, res) => {
  const llm = getLlmStatus();
  res.json({
    status: "ok",
    service: "healthcare-llm-service",
    ai: llm,
    mainApi: process.env.MAIN_API_URL || "http://127.0.0.1:5000",
  });
});

app.get("/smoke", (_req, res) => {
  res.send("✅ Healthcare LLM service");
});

app.use(aiRoutes);

app.listen(port, host, () => {
  const llm = getLlmStatus();
  console.log(`LLM Service on http://${host}:${port} (mode: ${llm.mode}, model: ${llm.model})`);
  console.log(`Main API context: ${process.env.MAIN_API_URL || "http://127.0.0.1:5000"}`);
});
