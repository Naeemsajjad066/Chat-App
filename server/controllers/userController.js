import { generateToken } from "../lib/utils.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js"

export const Signup = async (req, res) => {
    const { fullName, email, password, bio = "", publicKey = "" } = req.body;

    try {
        if (!fullName || !email || !password) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            bio,
            publicKey
        });

        const token = generateToken(newUser._id);
        res.json({ success: true, userData: newUser, token, message: "Account created successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

//Login User
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email });
        if (!userData) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = generateToken(userData._id);
        res.json({ success: true, userData, token, message: "Login Successful" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};


// COntroller to check if user is authenticated
export const checkAuth=(req,res)=>{
    try {
        res.json({success:true,user:req.user})
    } catch (error) {
        
    }
}

export const updateProfile=async(req,res)=>{
    try {
        const {profilePic,bio,fullName}=req.body;

        const userId=req.user._id;
        let updatedUser;
        if(!profilePic){
            updatedUser=await User.findByIdAndUpdate(userId,{bio,fullName},{new:true});
        }else{
            const upload=await cloudinary.uploader.upload(profilePic);
            updatedUser=await User.findByIdAndUpdate(userId,{profilePic:upload.secure_url,bio,fullName},{new:true})
        }

        res.json({success:true, user:updatedUser})
    } catch (error) {
        console.log(error.message);

        res.json({success:false,message:error.message})
        
        
    }
}