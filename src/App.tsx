import { useEffect, useState } from "react";
import type { User } from "./lib/types";
import { getCurrentUser, logout } from "./lib/auth";
import { AuthScreen } from "./components/AuthScreen";
import { MainApp } from "./components/MainApp";
import { Link2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setBooting(false);
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "vl_users" || e.key === "vl_current_user") setUser(getCurrentUser());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function handleLogout() { logout(); setUser(null); }

  if (booting) {
    return (
      <div className="h-[100dvh] flex items-center justify-center" style={{ background: "var(--color-bg-0)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[color:var(--color-accent)]">
            <Link2 size={22} className="text-white" />
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2 w-2 rounded-full bg-[color:var(--color-accent)] wave-bar" style={{ animationDelay: `${i * 0.18}s` }} />
            ))}
          </div>
          <p className="text-xs text-[color:var(--color-text-mute)]">Loading VoiceLink...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={setUser} />;

  return <MainApp user={user} onLogout={handleLogout} onUserUpdate={setUser} />;
}
