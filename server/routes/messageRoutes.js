import express, { Router } from "express"
import { protectRoute } from "../controllers/auth.js";
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage } from "../controllers/messageController.js";

const messageRouter=express.Router();

messageRouter.get("/user",protectRoute,getUsersForSidebar)
messageRouter.get("/:id",protectRoute,getMessages)
messageRouter.put("/mark/:id",protectRoute,markMessageAsSeen)
messageRouter.post("/send/:id",protectRoute,sendMessage)


export default messageRouter;