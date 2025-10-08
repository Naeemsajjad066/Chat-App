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

        // Validate that publicKey is provided for proper encryption setup
        if (!publicKey || publicKey.trim() === "") {
            return res.json({ 
                success: false, 
                message: "Encryption keys must be generated. Please try signing up again." 
            });
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
            publicKey: publicKey.trim() // Ensure no extra whitespace
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
        const {profilePic,bio,fullName,publicKey}=req.body;

        const userId=req.user._id;
        let updateData = {bio,fullName};
        
        // Only update publicKey if it's provided and not empty
        if(publicKey && publicKey.trim() !== "") {
            updateData.publicKey = publicKey.trim();
        }
        
        if(profilePic){
            const upload=await cloudinary.uploader.upload(profilePic);
            updateData.profilePic = upload.secure_url;
        }

        const updatedUser=await User.findByIdAndUpdate(userId, updateData, {new:true});

        res.json({success:true, user:updatedUser})
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
    }
}

// Delete User Profile
export const deleteProfile = async(req,res) => {
    try {
        const userId = req.user._id;
        
        // Delete user from database
        await User.findByIdAndDelete(userId);
        
        // You might also want to delete associated messages, but that depends on your business logic
        // await Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] });
        
        res.json({success: true, message: "Profile deleted successfully"});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Check if user has valid encryption setup
export const checkEncryptionSetup = async(req, res) => {
    try {
        const user = req.user;
        
        const hasValidKeys = user.publicKey && user.publicKey.trim() !== "";
        
        res.json({
            success: true, 
            hasValidKeys,
            message: hasValidKeys ? "Encryption setup is valid" : "Encryption keys missing"
        });
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}