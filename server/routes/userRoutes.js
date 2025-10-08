import express from "express";
import { checkAuth, login, Signup, updateProfile, deleteProfile } from "../controllers/userController.js";
import { protectRoute } from "../controllers/auth.js";


const userRouter=express.Router();


userRouter.post("/signup",Signup)
userRouter.post("/login",login)
userRouter.put("/update-profile",protectRoute,updateProfile)
userRouter.delete("/delete-profile",protectRoute,deleteProfile)
userRouter.get("/check",protectRoute,checkAuth)


export default userRouter;