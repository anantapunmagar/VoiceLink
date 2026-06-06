import { cn } from "../../utils/cn";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-ring disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap";
  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-[13px]",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
  };
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[color:var(--color-accent)] text-[color:var(--color-bg-0)] hover:brightness-110 active:brightness-95",
    secondary: "bg-[color:var(--color-bg-4)] text-[color:var(--color-text)] hover:bg-[color:var(--color-border-strong)]",
    ghost: "text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-3)]",
    danger: "bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/15",
    subtle:
      "bg-transparent text-[color:var(--color-text-dim)] border border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text)]",
  };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      {loading ? (
        <>
          <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export function Input({ label, error, hint, icon, className, id, ...rest }: InputProps) {
  const inputId = id || rest.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-mute)] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full h-10 rounded-md text-sm bg-[color:var(--color-bg-0)] border",
            "text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-mute)]",
            "focus:outline-none focus:border-[color:var(--color-accent)] transition-colors",
            icon ? "pl-9 pr-3" : "px-3",
            error ? "border-[color:var(--color-danger)]" : "border-[color:var(--color-border)]",
            className,
          )}
          {...rest}
        />
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-[color:var(--color-text-mute)]">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-[color:var(--color-danger)]">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...rest }: TextareaProps) {
  const inputId = id || rest.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] mb-2"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "w-full min-h-[80px] px-3 py-2 rounded-md text-sm bg-[color:var(--color-bg-0)] border resize-y",
          "text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-mute)]",
          "focus:outline-none focus:border-[color:var(--color-accent)] transition-colors",
          error ? "border-[color:var(--color-danger)]" : "border-[color:var(--color-border)]",
          className,
        )}
        {...rest}
      />
      {error && <p className="mt-1.5 text-xs text-[color:var(--color-danger)]">{error}</p>}
    </div>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-[color:var(--color-border)]" />
      {label && (
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-mute)]">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-[color:var(--color-border)]" />
    </div>
  );
}
