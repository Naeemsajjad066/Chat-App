import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";



const app = express();
const server = http.createServer(app);

//Initiliazie socket.io server
export const io=new Server(server,{
  cors:{origin:"*"}
})

//store online users

export const userSocketMap={}//{userid:socketId}

//socket.io connection handler function
io.on("connection",(socket)=>{
  const userId=socket.handshake.query.userId;
  
  if (!userId || userId === "undefined") {
    console.log("⚠️ Socket connection without valid userId");
    socket.disconnect();
    return;
  }

  console.log(`✅ User connected: ${userId} (Socket: ${socket.id})`);

  
  // Store the socket mapping
  userSocketMap[userId] = socket.id;

  // Emit updated online users list to all clients
  const onlineUserIds = Object.keys(userSocketMap);
  console.log(`📡 Broadcasting online users: [${onlineUserIds.length}] ${onlineUserIds.join(', ')}`);

  io.emit("getOnlineUsers", onlineUserIds);

  socket.on("disconnect",(reason)=>{
    console.log(`❌ User disconnected: ${userId} (Reason: ${reason})`);
    delete userSocketMap[userId];
    
    // Emit updated online users list
    const remainingUsers = Object.keys(userSocketMap);
    console.log(`📡 Broadcasting remaining users: [${remainingUsers.length}] ${remainingUsers.join(', ')}`);
    io.emit("getOnlineUsers", remainingUsers);
  });
})

// middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// test route
app.use("/api/status", (req, res) => res.send("Server is live"));

app.use("/api/auth",userRouter)
app.use("/api/messages",messageRouter)

const PORT = process.env.PORT || 5000;

// connect to mongodb
await connectDB();

// start server only after DB is connected
if(process.env.NODE_ENV !=="production"){
  server.listen(PORT, () => {
    console.log("✅ Server is running on port: " + PORT);
  });
}
//export server for vercel
export default server;