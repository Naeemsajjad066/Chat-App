import React, { lazy, Suspense, useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthContext } from "./context/AuthContext";
import Spinner from "./components/ui/Spinner";

// Critical path — loaded eagerly
import HomePage  from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

// Non-critical — code-split, loaded only when navigated to
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function AuthLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[url('/bgImage.svg')] bg-cover">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <Spinner size="md" />
    </div>
  );
}

export default function App() {
  const { authUser, isCheckingAuth } = useContext(AuthContext);

  if (isCheckingAuth) return <AuthLoader />;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#1e1b3a",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            fontSize: "14px",
            maxWidth: "90vw",
          },
          success: { iconTheme: { primary: "#a78bfa", secondary: "#1e1b3a" } },
          error:   { iconTheme: { primary: "#f87171", secondary: "#1e1b3a" } },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Chat page — fixed viewport, no scroll */}
          <Route path="/"
            element={authUser
              ? <div className="bg-[url('/bgImage.svg')] bg-cover bg-center h-dvh"><HomePage /></div>
              : <Navigate to="/login" replace />}
          />
          {/* Auth page — exact screen height, no scroll */}
          <Route path="/login"
            element={!authUser
              ? <div className="bg-[url('/bgImage.svg')] bg-cover bg-center h-dvh overflow-hidden"><LoginPage /></div>
              : <Navigate to="/" replace />}
          />
          {/* Profile page */}
          <Route path="/profile"
            element={authUser
              ? <div className="bg-[url('/bgImage.svg')] bg-cover bg-center min-h-dvh"><ProfilePage /></div>
              : <Navigate to="/login" replace />}
          />
        </Routes>
      </Suspense>
    </>
  );
}
