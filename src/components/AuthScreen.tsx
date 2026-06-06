import { useState, type FormEvent } from 'react';
import { ArrowRight, Link2, Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { login, signup } from '../lib/auth';
import { Button, Input, Divider } from './ui/Primitives';
import type { User } from '../lib/types';

interface AuthScreenProps {
  onAuth: (user: User) => void;
}
type Mode = 'login' | 'signup';

export function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  function reset() {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirm('');
    setError(null);
    setShowPw(false);
  }
  function switchMode(m: Mode) {
    setMode(m);
    reset();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTimeout(() => {
      let result;
      if (mode === 'signup') {
        if (password !== confirm) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        result = signup(username, email, password);
      } else {
        result = login(username || email, password);
      }
      setLoading(false);
      if (result.ok && result.user) onAuth(result.user);
      else if (result.error) setError(result.error);
    }, 220);
  }

  return (
    <div
      className="min-h-[100dvh] flex flex-col lg:flex-row"
      style={{ background: 'var(--color-bg-0)' }}
    >
      {/* Brand panel - hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden border-r border-[color:var(--color-border)]"
        style={{ background: 'var(--color-bg-1)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.06]"
            style={{
              background:
                'radial-gradient(circle at top right, var(--color-accent), transparent 60%)',
            }}
          />
        </div>
        <div className="flex items-center gap-3 z-10">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[color:var(--color-accent)]">
            <Link2 size={24} className="text-white" />
          </div>
          <span className="font-bold text-3xl text-[color:var(--color-text)]">VoiceLink</span>
        </div>
        <div className="z-10 mt-10">
          <h1 className="text-5xl font-bold text-[color:var(--color-text)] leading-tight mb-6">
            Your place to
            <br />
            <span className="text-[color:var(--color-accent)]">talk and hang out.</span>
          </h1>
          <p className="text-[color:var(--color-text-dim)] text-xl leading-relaxed mb-10 max-w-sm">
            Servers, channels, voice calls, video, and direct messages. Everything in one place.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            {[
              ['Voice & Video', 'Crystal-clear calls with WebRTC'],
              ['Text Channels', 'Organised server channels'],
              ['Direct Messages', 'Private one-on-one chats'],
              ['Server Invites', 'Share a link and bring friends'],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-2)]"
              >
                <p className="text-base font-semibold text-[color:var(--color-text)] mb-1">
                  {title}
                </p>
                <p className="text-sm text-[color:var(--color-text-mute)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-[color:var(--color-text-mute)] z-10">
          VoiceLink &copy; 2026 &middot; MIT License
        </p>
      </div>

      {/* Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 safe-top safe-bottom">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[color:var(--color-accent)]">
              <Link2 size={24} className="text-white" />
            </div>
            <span className="font-bold text-2xl text-[color:var(--color-text)]">VoiceLink</span>
          </div>

          <h2 className="text-3xl font-bold text-[color:var(--color-text)] mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-base text-[color:var(--color-text-dim)] mb-6">
            {mode === 'login'
              ? 'Sign in to continue to VoiceLink.'
              : 'Join VoiceLink in under a minute.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {mode === 'signup' && (
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                autoComplete="username"
                required
                icon={<UserIcon size={16} />}
                className="h-11 text-base"
              />
            )}
            <Input
              label={mode === 'login' ? 'Username or Email' : 'Email'}
              type={mode === 'login' ? 'text' : 'email'}
              value={mode === 'login' ? username : email}
              onChange={(e) =>
                mode === 'login' ? setUsername(e.target.value) : setEmail(e.target.value)
              }
              placeholder={mode === 'login' ? 'you or you@example.com' : 'you@example.com'}
              autoComplete={mode === 'login' ? 'username' : 'email'}
              required
              icon={<Mail size={16} />}
              className="h-11 text-base"
            />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-[color:var(--color-text-dim)]">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-mute)]">
                  <Lock size={16} />
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  className="w-full h-11 rounded-lg border text-base bg-[color:var(--color-bg-2)] text-[color:var(--color-text)] border-[color:var(--color-border)] focus:border-[color:var(--color-accent)] placeholder:text-[color:var(--color-text-mute)] transition-colors focus:outline-none pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {mode === 'signup' && (
              <Input
                label="Confirm Password"
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
                icon={<Lock size={16} />}
                className="h-11 text-base"
              />
            )}

            {error && (
              <div className="px-3 py-2.5 rounded-lg text-base text-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)] border border-[color:var(--color-danger)]/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="w-full mt-2 text-base h-12"
            >
              {mode === 'login' ? 'Sign in' : 'Create account'}
              {!loading && <ArrowRight size={18} />}
            </Button>
            <Divider />
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              className="text-center text-base text-[color:var(--color-text-dim)] hover:text-[color:var(--color-accent)] transition-colors py-2"
            >
              {mode === 'login'
                ? "Don't have an account? Register"
                : 'Already have an account? Sign in'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[color:var(--color-text-mute)]">
            Accounts are stored locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
