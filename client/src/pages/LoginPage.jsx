import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../context/AuthContext";

// ── Password strength ─────────────────────────────────────────────────────────
const strengthChecks = [
  { label: "8+ chars",     test: (p) => p.length >= 8 },
  { label: "Uppercase",    test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase",    test: (p) => /[a-z]/.test(p) },
  { label: "Number",       test: (p) => /[0-9]/.test(p) },
  { label: "Symbol",       test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const strengthLabel = ["", "Very weak", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["", "text-red-400", "text-orange-400", "text-yellow-400", "text-lime-400", "text-green-400"];
const barColor      = ["", "bg-red-500",   "bg-orange-500",   "bg-yellow-400",   "bg-lime-400",   "bg-green-500"];

function PasswordStrengthBar({ password }) {
  if (!password) return null;
  const passed = strengthChecks.filter((c) => c.test(password)).length;

  return (
    <div className="space-y-2 pt-1">
      {/* Bar */}
      <div className="flex gap-1 items-center">
        <div className="flex gap-1 flex-1">
          {strengthChecks.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300
                ${i < passed ? barColor[passed] : "bg-white/10"}`}
            />
          ))}
        </div>
        <span className={`text-[11px] font-medium ml-2 w-16 text-right ${strengthColor[passed]}`}>
          {strengthLabel[passed]}
        </span>
      </div>
      {/* Chips */}
      <div className="flex flex-wrap gap-x-2 gap-y-1">
        {strengthChecks.map((c) => {
          const ok = c.test(password);
          return (
            <span key={c.label}
              className={`text-[11px] flex items-center gap-0.5 transition-colors
                ${ok ? "text-green-400" : "text-gray-600"}`}
            >
              <span className="text-[10px]">{ok ? "✓" : "○"}</span>
              {c.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Reusable pieces ───────────────────────────────────────────────────────────
function EyeToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2
        w-8 h-8 flex items-center justify-center
        text-gray-500 hover:text-gray-300 active:text-gray-200 transition"
    >
      {visible ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M18.536 15.536L17.121 14.121M18.536 15.536L19.95 16.95M17.121 14.121L15.707 12.707" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-gray-400">{label}</label>
      )}
      {children}
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-red-400">
          <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/* Base input class — font-size 16px prevents iOS auto-zoom */
const inputCls = (hasError) =>
  `w-full bg-white/5 border rounded-xl px-4 py-3 text-base text-white
   placeholder-gray-600 outline-none transition
   focus:bg-white/8
   ${hasError
     ? "border-red-500/60 focus:border-red-500/80"
     : "border-white/10 focus:border-violet-500/60"
   }`;

// ── Steps ─────────────────────────────────────────────────────────────────────
const S = { LOGIN: "login", INFO: "info", BIO: "bio" };

export default function LoginPage() {
  const { login } = useContext(AuthContext);

  const [step, setStep]           = useState(S.LOGIN);
  const [loading, setLoading]     = useState(false);
  const [showPw, setShowPw]       = useState(false);

  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [bio, setBio]             = useState("");
  const [errors, setErrors]       = useState({});

  const isSignup = step !== S.LOGIN;

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateLogin = () => {
    const e = {};
    if (!email.trim())                                    e.email    = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))  e.email    = "Enter a valid email.";
    if (!password)                                        e.password = "Password is required.";
    return e;
  };

  const validateInfo = () => {
    const e = {};
    if (!fullName.trim())                                 e.fullName = "Full name is required.";
    else if (fullName.trim().length < 2)                  e.fullName = "At least 2 characters.";
    if (!email.trim())                                    e.email    = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))  e.email    = "Enter a valid email.";
    const passed = strengthChecks.filter((c) => c.test(password)).length;
    if (!password)                                        e.password = "Password is required.";
    else if (passed < 5)                                  e.password = "Password doesn't meet all requirements yet.";
    return e;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === S.INFO) {
      const errs = validateInfo();
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
      setStep(S.BIO);
      return;
    }

    const errs = step === S.LOGIN ? validateLogin() : {};
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});

    if (step === S.LOGIN) {
      await login("login", { email, password });
    } else {
      await login("signup", { fullName, email, password, bio });
    }

    setLoading(false);
  };

  const toSignup = () => { setStep(S.INFO); setErrors({}); setPassword(""); setShowPw(false); };
  const toLogin  = () => { setStep(S.LOGIN); setErrors({}); setPassword(""); setShowPw(false); };
  const goBack   = () => { setStep(S.INFO); setErrors({}); };

  // ── Step indicator ──────────────────────────────────────────────────────────
  const StepDots = () => (
    <div className="flex items-center gap-2">
      {[S.INFO, S.BIO].map((s, i) => {
        const done    = step === S.BIO && i === 0;
        const current = step === s;
        return (
          <React.Fragment key={s}>
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
              transition-all duration-200
              ${done    ? "bg-violet-500/40 text-violet-300"
              : current ? "bg-violet-600 text-white"
              :           "bg-white/8 text-gray-600"}
            `}>
              {done ? "✓" : i + 1}
            </div>
            {i === 0 && (
              <div className={`flex-1 h-px transition-all duration-300
                ${step === S.BIO ? "bg-violet-500/40" : "bg-white/8"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    /*
     * On mobile: full-screen scroll container so the form is always reachable
     * even when the virtual keyboard is open.
     * On desktop: centered card.
     */
    <div className="min-h-dvh w-full flex flex-col items-center justify-start
      sm:justify-center px-4 py-8 sm:py-12 overflow-y-auto">

      {/* Logo */}
      <div className="mb-6 sm:mb-8">
        <img src={assets.logo_big} alt="Logo" className="h-10 sm:h-12 object-contain" />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm sm:max-w-md
        bg-white/5 border border-white/10 rounded-2xl
        shadow-2xl backdrop-blur-xl
        p-6 sm:p-8 space-y-5">

        {/* Header */}
        <div className="space-y-1">
          {isSignup && <StepDots />}
          <div className="flex items-center justify-between pt-1">
            <div>
              <h1 className="text-xl font-semibold text-white">
                {step === S.LOGIN && "Welcome back"}
                {step === S.INFO  && "Create account"}
                {step === S.BIO   && "One last thing"}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {step === S.LOGIN && "Sign in to continue chatting"}
                {step === S.INFO  && "Fill in your details to get started"}
                {step === S.BIO   && "Add a short bio — you can skip this"}
              </p>
            </div>
            {step === S.BIO && (
              <button
                type="button"
                onClick={goBack}
                className="w-9 h-9 flex items-center justify-center rounded-full
                  text-gray-400 hover:text-white hover:bg-white/10
                  active:bg-white/15 transition flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* ── Login ── */}
          {step === S.LOGIN && (
            <>
              <Field label="Email address" error={errors.email}>
                <input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                  className={inputCls(!!errors.email)}
                />
              </Field>

              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                    className={`${inputCls(!!errors.password)} pr-11`}
                  />
                  <EyeToggle visible={showPw} onToggle={() => setShowPw((v) => !v)} />
                </div>
              </Field>
            </>
          )}

          {/* ── Signup step 1 ── */}
          {step === S.INFO && (
            <>
              <Field label="Full name" error={errors.fullName}>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: "" })); }}
                  className={inputCls(!!errors.fullName)}
                />
              </Field>

              <Field label="Email address" error={errors.email}>
                <input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                  className={inputCls(!!errors.email)}
                />
              </Field>

              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                    className={`${inputCls(!!errors.password)} pr-11`}
                  />
                  <EyeToggle visible={showPw} onToggle={() => setShowPw((v) => !v)} />
                </div>
                <PasswordStrengthBar password={password} />
              </Field>
            </>
          )}

          {/* ── Signup step 2 ── */}
          {step === S.BIO && (
            <Field label="Bio (optional)">
              <textarea
                rows={4}
                placeholder="Tell others a little about yourself…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                className={`${inputCls(false)} resize-none`}
              />
              <p className="text-right text-[11px] text-gray-600 mt-1">{bio.length}/160</p>
            </Field>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl
              bg-gradient-to-r from-violet-600 to-purple-600
              hover:from-violet-500 hover:to-purple-500
              active:from-violet-700 active:to-purple-700
              active:scale-[0.98]
              text-white font-semibold text-base
              transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {loading && <Spinner />}
            {loading
              ? "Please wait…"
              : step === S.LOGIN ? "Sign in"
              : step === S.INFO  ? "Continue"
              :                    "Create account"}
          </button>
        </form>

        {/* Switch mode */}
        <p className="text-center text-sm text-gray-500">
          {step === S.LOGIN ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={toSignup}
                className="text-violet-400 hover:text-violet-300 font-semibold transition"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={toLogin}
                className="text-violet-400 hover:text-violet-300 font-semibold transition"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
