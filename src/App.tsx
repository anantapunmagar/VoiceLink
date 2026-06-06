import { useEffect, useState } from 'react';
import { useAppStore } from './lib/store';
import { AuthScreen } from './components/AuthScreen';
import { MainApp } from './components/MainApp';
import { Link2 } from 'lucide-react';
import { Toaster } from 'sonner';

export default function App() {
  const { currentUser, setCurrentUser } = useAppStore();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    // Bootstrap from store (already persisted)
    setBooting(false);
  }, []);

  function handleLogout() {
    setCurrentUser(null);
  }

  if (booting) {
    return (
      <div
        className="h-[100dvh] flex items-center justify-center"
        style={{ background: 'var(--color-bg-0)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[color:var(--color-accent)]">
            <Link2 size={22} className="text-white" />
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-[color:var(--color-accent)] wave-bar"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
          <p className="text-xs text-[color:var(--color-text-mute)]">Loading VoiceLink...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <AuthScreen onAuth={setCurrentUser} />;

  return (
    <>
      <MainApp user={currentUser} onLogout={handleLogout} onUserUpdate={setCurrentUser} />
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
