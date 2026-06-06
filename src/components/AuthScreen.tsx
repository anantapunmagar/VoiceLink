import { useState, type FormEvent } from "react";
import { ArrowRight, Link2, Mail, Lock, User as UserIcon } from "lucide-react";
import { login, signup } from "../lib/auth";
import { Button, Input, Divider } from "./ui/Primitives";
import type { User } from "../lib/types";

interface AuthScreenProps {
  onAuth: (user: User) => void;
}

type Mode = "login" | "signup";

export function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  function resetFields() {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirm("");
    setError(null);
  }

  function switchMode(m: Mode) {
    setMode(m);
    resetFields();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Slight delay so the loading state is visible
    setTimeout(() => {
      let result;
      if (mode === "signup") {
        if (password !== confirm) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }
        result = signup(username, email, password);
      } else {
        result = login(username || email, password);
      }

      setLoading(false);
      if (result.ok && result.user) {
        onAuth(result.user);
      } else if (result.error) {
        setError(result.error);
      }
    }, 250);
  }

  return (
    <div className="min-h-full flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 bg-[color:var(--color-bg-1)] border-r border-[color:var(--color-border)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
             style={{
               backgroundImage:
                 "radial-gradient(circle at 20% 10%, #d4a574 0px, transparent 40%), radial-gradient(circle at 80% 80%, #7c93f5 0px, transparent 40%)",
             }}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[color:var(--color-accent)] flex items-center justify-center">
              <Link2 className="h-5 w-5 text-[color:var(--color-bg-0)]" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-semibold tracking-tight">VoiceLink</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">
            Where conversations <span className="text-[color:var(--color-accent)]">find a home.</span>
          </h1>
          <p className="text-[color:var(--color-text-dim)] text-base leading-relaxed max-w-md">
            Hang out in voice rooms, jump into video calls, and stay in touch with the people who matter. All in one calm, focused place.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md pt-4">
            <Feature icon="audio-lines" label="Crystal-clear voice" />
            <Feature icon="video" label="HD video rooms" />
            <Feature icon="message-square" label="Persistent chat" />
            <Feature icon="users" label="Built for teams" />
          </div>
        </div>

        <div className="relative text-xs text-[color:var(--color-text-mute)]">
          VoiceLink &middot; Crafted with care
        </div>
      </div>

      {/* Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="h-9 w-9 rounded-lg bg-[color:var(--color-accent)] flex items-center justify-center">
              <Link2 className="h-5 w-5 text-[color:var(--color-bg-0)]" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-semibold tracking-tight">VoiceLink</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1.5 text-sm text-[color:var(--color-text-dim)]">
              {mode === "login"
                ? "Sign in to pick up right where you left off."
                : "It takes less than a minute to get started."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === "signup" && (
              <Input
                label="Username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alex_rivera"
                autoComplete="username"
                required
                icon={<UserIcon className="h-4 w-4" />}
              />
            )}
            {mode === "login" && (
              <Input
                label="Username or email"
                name="identifier"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="you@domain.com"
                autoComplete="username"
                required
                icon={<Mail className="h-4 w-4" />}
              />
            )}
            {mode === "signup" && (
              <Input
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                autoComplete="email"
                required
                icon={<Mail className="h-4 w-4" />}
              />
            )}
            <Input
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              icon={<Lock className="h-4 w-4" />}
            />
            {mode === "signup" && (
              <Input
                label="Confirm password"
                name="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
                icon={<Lock className="h-4 w-4" />}
              />
            )}

            {error && (
              <div className="rounded-md border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 px-3 py-2 text-sm text-[color:var(--color-danger)]">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              {mode === "login" ? "Sign in" : "Create account"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <Divider label={mode === "login" ? "New here?" : "Already a member?"} />

          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            className="w-full text-center text-sm text-[color:var(--color-text-dim)] hover:text-[color:var(--color-accent)] transition-colors"
          >
            {mode === "login"
              ? "Create a new account"
              : "Sign in to an existing account"}
          </button>

          <p className="mt-8 text-[11px] text-[color:var(--color-text-mute)] leading-relaxed">
            By continuing you agree to keep your password safe. VoiceLink stores accounts locally in your browser for this demo.
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: string; label: string }) {
  const icons: Record<string, React.ReactNode> = {
    "audio-lines": <AudioLinesIcon />,
    video: <VideoIcon />,
    "message-square": <MessageIcon />,
    users: <UsersIcon />,
  };
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[color:var(--color-bg-2)] border border-[color:var(--color-border)]">
      <div className="text-[color:var(--color-accent)]">{icons[icon]}</div>
      <span className="text-sm text-[color:var(--color-text)]">{label}</span>
    </div>
  );
}

function AudioLinesIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10v4M6 6v12M10 3v18M14 8v8M18 5v14M22 10v4" />
    </svg>
  );
}
function VideoIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}
function MessageIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
