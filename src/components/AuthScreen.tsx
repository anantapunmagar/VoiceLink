import { useState, type FormEvent } from "react";
import { ArrowRight, Link2, Mail, Lock, User as UserIcon, Eye, EyeOff, Mic, Video, MessageSquare, Users } from "lucide-react";
import { login, signup } from "../lib/auth";
import { Button, Input, Divider } from "./ui/Primitives";
import type { User } from "../lib/types";

interface AuthScreenProps {
  onAuth: (user: User) => void;
}

type Mode = "login" | "signup";

const features = [
  { icon: <Mic size={16} />, label: "Crystal-clear voice" },
  { icon: <Video size={16} />, label: "HD video calls" },
  { icon: <MessageSquare size={16} />, label: "Real-time messaging" },
  { icon: <Users size={16} />, label: "Team servers" },
];

export function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    setShowPassword(false);
  }

  function switchMode(m: Mode) {
    setMode(m);
    resetFields();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
    <div className="min-h-screen flex" style={{ background: "var(--color-bg-0)" }}>
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-bg-1) 0%, var(--color-bg-2) 100%)" }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, var(--color-accent), transparent)" }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #7c93f5, transparent)" }}
          />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-accent)" }}
          >
            <Link2 size={20} style={{ color: "var(--color-bg-0)" }} />
          </div>
          <span className="font-bold text-xl text-[color:var(--color-text)]">VoiceLink</span>
        </div>

        {/* Headline */}
        <div className="z-10 max-w-md">
          <h1
            className="text-4xl font-bold leading-tight mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Where conversations
            <span style={{ color: "var(--color-accent)" }}> find a home.</span>
          </h1>
          <p className="text-lg text-[color:var(--color-text-dim)] mb-10 leading-relaxed">
            Hang out in voice rooms, jump into video calls, and stay in touch with the people who matter.
            All in one calm, focused place.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(212,165,116,0.07)", border: "1px solid rgba(212,165,116,0.12)" }}
              >
                <span className="text-[color:var(--color-accent)]">{icon}</span>
                <span className="text-sm text-[color:var(--color-text-dim)]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[color:var(--color-text-mute)] z-10">
          VoiceLink · Crafted with care · MIT License
        </p>
      </div>

      {/* Auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--color-accent)" }}
            >
              <Link2 size={16} style={{ color: "var(--color-bg-0)" }} />
            </div>
            <span className="font-bold text-lg text-[color:var(--color-text)]">VoiceLink</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[color:var(--color-text)] mb-1">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-[color:var(--color-text-dim)]">
              {mode === "login"
                ? "Sign in to pick up right where you left off."
                : "It takes less than a minute to get started."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alex_rivera"
                autoComplete="username"
                required
                icon={<UserIcon size={15} />}
              />
            )}
            <Input
              label={mode === "login" ? "Username or email" : "Email"}
              type={mode === "login" ? "text" : "email"}
              value={mode === "login" ? username : email}
              onChange={(e) => mode === "login" ? setUsername(e.target.value) : setEmail(e.target.value)}
              placeholder="you@domain.com"
              autoComplete={mode === "login" ? "username" : "email"}
              required
              icon={<Mail size={15} />}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-dim)]">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-mute)]">
                  <Lock size={15} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  className="w-full h-10 rounded-lg border text-sm transition-colors focus-ring bg-[color:var(--color-bg-0)] text-[color:var(--color-text)] border-[color:var(--color-border)] focus:border-[color:var(--color-accent)] placeholder:text-[color:var(--color-text-mute)] pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {mode === "signup" && (
              <Input
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
                icon={<Lock size={15} />}
              />
            )}

            {error && (
              <div className="px-3 py-2.5 rounded-lg text-sm text-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10 border border-[color:var(--color-danger)]/20">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="mt-1 w-full">
              {mode === "login" ? "Sign in" : "Create account"}
              {!loading && <ArrowRight size={16} />}
            </Button>

            <Divider />

            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="w-full text-center text-sm text-[color:var(--color-text-dim)] hover:text-[color:var(--color-accent)] transition-colors py-1"
            >
              {mode === "login"
                ? "Don't have an account? Create one"
                : "Already have an account? Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[color:var(--color-text-mute)] leading-relaxed">
            VoiceLink stores accounts locally in your browser for this demo.
          </p>
        </div>
      </div>
    </div>
  );
}
