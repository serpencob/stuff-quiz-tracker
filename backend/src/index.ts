import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { supabase } from "./supabaseClient.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "quiz-tracker-backend",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/backend-mode", (_request, response) => {
  response.json({
    mode: supabase ? "node-api-plus-supabase" : "node-api-only",
    supabaseConfigured: Boolean(supabase)
  });
});

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});
