import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import userRoutes   from "./routes/user.routes.js";
import { setupWebSocketServer } from "./ws/handler.js";

const PORT = process.env["PORT"] ? parseInt(process.env["PORT"]) : 8080;
const CLIENT_ORIGIN = process.env["CLIENT_ORIGIN"] ?? "http://localhost:5173";
const allowedOrigins = CLIENT_ORIGIN.split(",").map((origin) => origin.trim());

async function main(): Promise<void> {
  // ── Database ────────────────────────────────────────────────
  await connectDB();

  // ── Express app ─────────────────────────────────────────────
  const app = express();

  // ── CORS ───────────────────────────────────────────────────────
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin) || // More permissive for Vercel
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked: ${origin}`);
        callback(new Error(`CORS: origin not allowed — ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  app.use(cors(corsOptions));
  app.options(/(.*)/, cors(corsOptions)); // Express 5 requires regex wildcard
  app.use(express.json());


  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // REST routes
  app.use("/api/auth",   authRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/user",   userRoutes);

  // ── HTTP server (shared by Express + WS) ────────────────────
  const httpServer = http.createServer(app);

  // ── WebSocket server ─────────────────────────────────────────
  setupWebSocketServer(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Allowed Origins: ${allowedOrigins.join(", ")}`);
    console.log(`   REST  → http://localhost:${PORT}/api/auth`);
    console.log(`   REST  → http://localhost:${PORT}/api/upload`);
    console.log(`   REST  → http://localhost:${PORT}/api/user`);
    console.log(`   WS    → ws://localhost:${PORT}?token=<jwt>`);
  });
}

main().catch((err) => {
  console.error("❌ Fatal startup error:", err);
  process.exit(1);
});
