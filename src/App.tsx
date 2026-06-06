import { useEffect, useState } from "react";
import type { User } from "./lib/types";
import { getCurrentUser } from "./lib/auth";
import { AuthScreen } from "./components/AuthScreen";
import { MainApp } from "./components/MainApp";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  // Hydrate session on mount
  useEffect(() => {
    const current = getCurrentUser();
    setUser(current);
    setBooting(false);
  }, []);

  // Cross-tab user update sync (simple version via storage event)
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

  if (booting) {
    return (
      <div className="h-full flex items-center justify-center bg-[color:var(--color-bg-0)]">
        <div className="flex items-center gap-3 text-[color:var(--color-text-dim)]">
          <span className="inline-block h-4 w-4 rounded-full border-2 border-[color:var(--color-accent)] border-t-transparent animate-spin" />
          <span className="text-sm">Loading VoiceLink...</span>
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
      onLogout={() => setUser(null)}
      onUserUpdate={setUser}
    />
  );
}
