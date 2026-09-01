import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,

  {
    // Target all JS files in the server
    files: ["**/*.js"],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Node.js built-ins
        ...globals.node,
      },
    },

    rules: {
      // ── Errors ────────────────────────────────────────────────────────────
      "no-unused-vars": ["error", {
        vars: "all",
        args: "after-used",
        // Allow unused vars that start with _ (e.g. _req in Express handlers)
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "no-undef":            "error",
      "no-console":          "off",   // console.log is fine in Node backends
      "no-duplicate-imports": "error",

      // ── Warnings ──────────────────────────────────────────────────────────
      "no-unreachable": "warn",
      "eqeqeq":         ["warn", "always", { null: "ignore" }],

      // ── Style (non-blocking, just guidance) ───────────────────────────────
      "prefer-const":   "warn",
      "no-var":         "warn",
    },
  },

  {
    // Ignore generated/installed files
    ignores: ["node_modules/**", "dist/**"],
  },
];
