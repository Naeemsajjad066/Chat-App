import React from "react";
import Spinner from "./Spinner";

/**
 * Reusable button with built-in loading state.
 *
 * @param {"primary"|"danger"|"ghost"|"outline"} variant
 */
const variants = {
  primary: "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white",
  danger:  "bg-red-600 hover:bg-red-700 text-white",
  ghost:   "hover:bg-white/8 text-gray-300",
  outline: "border border-white/10 text-gray-300 hover:bg-white/5",
};

const Button = React.memo(function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-2
        px-4 py-2.5 rounded-xl font-medium text-sm
        transition-all duration-150 active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
});

export default Button;
