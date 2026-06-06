import { useEffect, useState } from "react";
import type { User } from "./lib/types";
import { getCurrentUser } from "./lib/auth";
import { AuthScreen } from "./components/AuthScreen";
import { MainApp } from "./components/MainApp";
import { logout } from "./lib/auth";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  // Hydrate session on mount
  useEffect(() => {
    const current = getCurrentUser();
    setUser(current);
    setBooting(false);
  }, []);

  // Cross-tab user update sync
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "vl_users" || e.key === "vl_current_user") {
        const current = getCurrentUser();
        setUser(current);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function handleLogout() {
    logout();
    setUser(null);
  }

  if (booting) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: "var(--color-bg-0)" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-accent)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#090a0c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-[color:var(--color-accent)] wave-bar"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-[color:var(--color-text-mute)]">Loading VoiceLink…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuth={setUser} />;
  }

  return (
    <MainApp
      user={user}
      onLogout={handleLogout}
      onUserUpdate={setUser}
    />
  );
}
