import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../config/cloudinary.js";

// ─── helpers ──────────────────────────────────────────────────────────────────

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const passwordRules = (password) => {
  const errors = [];
  if (password.length < 8)          errors.push("at least 8 characters");
  if (!/[a-z]/.test(password))      errors.push("a lowercase letter");
  if (!/[A-Z]/.test(password))      errors.push("an uppercase letter");
  if (!/[0-9]/.test(password))      errors.push("a number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("a special character");
  return errors;
};

// ─── signup ───────────────────────────────────────────────────────────────────

export const Signup = async (req, res) => {
  const { fullName, email, password, bio = "" } = req.body;

  try {
    // Validate required fields
    if (!fullName?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const pwErrors = passwordRules(password);
    if (pwErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Password must contain ${pwErrors.join(", ")}.`,
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      bio: bio.trim(),
    });

    const token = generateToken(newUser._id);

    // Don't send password back
    const userResponse = { ...newUser.toObject() };
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      userData: userResponse,
      token,
      message: "Account created successfully. Welcome!",
    });
  } catch (error) {
    console.error("[Signup]", error.message);
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
};

// ─── login ────────────────────────────────────────────────────────────────────

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email?.trim() || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const userData = await User.findOne({ email: email.toLowerCase().trim() });

    // Use a constant-time compare even when user doesn't exist (prevents timing attacks)
    const dummyHash = "$2b$12$invalidhashfortimingprotection000000000000000000000000";
    const isPasswordCorrect = userData
      ? await bcrypt.compare(password, userData.password)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!userData || !isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = generateToken(userData._id);

    const userResponse = { ...userData.toObject() };
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      userData: userResponse,
      token,
      message: "Welcome back!",
    });
  } catch (error) {
    console.error("[Login]", error.message);
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
};

// ─── check auth ───────────────────────────────────────────────────────────────

export const checkAuth = (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    console.error("[checkAuth]", error.message);
    res.status(500).json({ success: false, message: "Auth check failed." });
  }
};

// ─── update profile ───────────────────────────────────────────────────────────

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;

    if (!fullName?.trim()) {
      return res.status(400).json({ success: false, message: "Name cannot be empty." });
    }

    const updateData = {
      bio: bio?.trim() ?? "",
      fullName: fullName.trim(),
    };

    if (profilePic) {
      const upload = await cloudinary.uploader.upload(profilePic, {
        folder: "chat_app/avatars",
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
      });
      updateData.profilePic = upload.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");

    return res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("[updateProfile]", error.message);
    return res.status(500).json({ success: false, message: "Failed to update profile." });
  }
};

// ─── delete profile ───────────────────────────────────────────────────────────

export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    await User.findByIdAndDelete(userId);
    return res.json({ success: true, message: "Account deleted successfully." });
  } catch (error) {
    console.error("[deleteProfile]", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete account." });
  }
};
