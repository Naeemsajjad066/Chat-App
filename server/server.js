import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

// ── App & HTTP server ─────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

/** userId → socketId map (in-memory; swap for Redis adapter in multi-instance) */
export const userSocketMap = {};

/** userId → currently-open chatPartnerId (so we can auto-mark seen on send) */
export const receiverCurrentChat = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (!userId || userId === "undefined") {
    socket.disconnect();
    return;
  }

  userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Track which conversation this user has open
  socket.on("openChat", ({ withUserId }) => {
    receiverCurrentChat[userId] = withUserId || null;
    console.log(`[openChat] user=${userId} viewing chat with=${withUserId}`);
  });
  socket.on("closeChat", () => {
    receiverCurrentChat[userId] = null;
    console.log(`[closeChat] user=${userId}`);
  });

  // Typing indicators
  socket.on("typing", ({ toUserId }) => {
    const sid = userSocketMap[toUserId];
    if (sid) io.to(sid).emit("userTyping", { fromUserId: userId });
  });

  socket.on("stopTyping", ({ toUserId }) => {
    const sid = userSocketMap[toUserId];
    if (sid) io.to(sid).emit("userStopTyping", { fromUserId: userId });
  });

  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    delete receiverCurrentChat[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow Cloudinary images
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "4mb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/api/status", (_req, res) => res.json({ status: "ok", ts: Date.now() }));
app.use("/api/auth",     userRouter);
app.use("/api/messages", messageRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found." }));

// ── Central error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

await connectDB();

if (process.env.NODE_ENV !== "production") {
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

export default server;
