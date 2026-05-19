import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  deleteMessages,
  getMessages,
  getUsersForSidebar,
  markMessageAsSeen,
  sendMessage,
} from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/user",          protectRoute, getUsersForSidebar);
messageRouter.get("/:id",           protectRoute, getMessages);
messageRouter.put("/mark/:id",      protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id",     protectRoute, sendMessage);
messageRouter.delete("/delete/:id", protectRoute, deleteMessages);

export default messageRouter;
