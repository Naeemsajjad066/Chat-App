import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
    bio: { type: String, default: "" },
    publicKey: { 
        type: String, 
        default: "",
        required: function() {
            // Public key is required for encryption but can be empty for legacy users
            return false;
        }
    },
}, {
    timestamps: true
});

const User = mongoose.model("User", userSchema);
export default User;
