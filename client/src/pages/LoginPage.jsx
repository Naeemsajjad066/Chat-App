import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../context/AuthContext";
import { generateKeyPair } from "../lib/cryptoUtils";
import toast from "react-hot-toast";

function LoginPage() {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);

  // Password strength checker (returns boolean)
  const isPasswordStrong = (password) => {
    const minLength = password.length >= 8;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    
    return minLength && hasLowercase && hasUppercase && hasNumber && hasSpecialChar;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Step 1: Show bio input for signup
    if (currState === "Sign up" && !isDataSubmitted) {
      // Check password strength before proceeding
      if (!isPasswordStrong(password)) {
        toast.error("Password must be at least 8 characters and include uppercase, lowercase, number, and special character");
        return;
      }
      setIsDataSubmitted(true);
      return;
    }

    let publicKey = null;

    // Step 2: Generate keypair only once if signing up
    if (currState === "Sign up" && !localStorage.getItem("privateKey")) {
      try {
        const keyPair = await generateKeyPair();
        localStorage.setItem("privateKey", keyPair.privateKey);
        publicKey = keyPair.publicKey;
        console.log("Generated new keypair for signup");
      } catch (err) {
        console.error("Key generation failed", err);
        return;
      }
    }

    // Step 3: Call login/signup function
    login(currState === "Sign up" ? "signup" : "login", {
      fullName,
      email,
      password,
      bio,
      ...(currState === "Sign up" ? { publicKey } : {}),
    });
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl">
      <img
        src={assets.logo_big}
        alt=""
        className="w-[min(30vw,250px)]"
      />

      <form
        onSubmit={onSubmitHandler}
        className="border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg"
      >
        <h2 className="font-medium text-2xl flex justify-between items-center">
          {currState}
          {isDataSubmitted && (
            <img
              onClick={() => setIsDataSubmitted(false)}
              src={assets.arrow_icon}
              alt=""
              className="w-5 cursor-pointer"
            />
          )}
        </h2>

        {/* Full name input for signup */}
        {currState === "Sign up" && !isDataSubmitted && (
          <input
            type="text"
            placeholder="Enter Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        )}

        {/* Email & Password inputs */}
        {!isDataSubmitted && (
          <>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-2 pr-12 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M18.536 15.536L17.121 14.121M18.536 15.536L19.95 16.95M17.121 14.121L15.707 12.707" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </>
        )}

        {/* Bio input for signup */}
        {currState === "Sign up" && isDataSubmitted && (
          <textarea
            rows={4}
            placeholder="Provide a short bio..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        )}

        <button
          type="submit"
          className="py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer"
        >
          {currState === "Sign up" ? "Create Account" : "Login Now"}
        </button>

        <div className="flex gap-2 items-center text-sm text-gray-500">
          <input type="checkbox" />
          <p>Agree to the terms of use & privacy policy.</p>
        </div>

        <div className="flex flex-col gap-2">
          {currState === "Sign up" ? (
            <p className="text-sm text-gray-600">
              Already have an Account{" "}
              <span
                onClick={() => {
                  setCurrState("Login");
                  setIsDataSubmitted(false);
                  setPassword("");
                }}
                className="font-medium text-violet-500 cursor-pointer"
              >
                login here
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Create an account{" "}
              <span
                onClick={() => {
                  setCurrState("Sign up");
                  setIsDataSubmitted(false);
                  setPassword("");
                }}
                className="font-medium text-violet-500 cursor-pointer"
              >
                Click Here
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
