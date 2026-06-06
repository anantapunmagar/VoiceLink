import { cn } from "../../utils/cn";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle" | "success";
type ButtonSize = "xs" | "sm" | "md" | "lg";

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
    xs: "h-7 px-2.5 text-xs",
    sm: "h-8 px-3 text-[13px]",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
  };
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[color:var(--color-accent)] text-[color:var(--color-bg-0)] hover:brightness-110 active:brightness-95",
    secondary:
      "bg-[color:var(--color-bg-4)] text-[color:var(--color-text)] hover:bg-[color:var(--color-border-strong)]",
    ghost:
      "text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-3)]",
    danger:
      "bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/20",
    subtle:
      "bg-transparent text-[color:var(--color-text-dim)] border border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text)]",
    success:
      "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] hover:bg-[color:var(--color-success)]/25",
  };
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          Please wait...
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
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-dim)]"
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
            "w-full h-10 rounded-lg border text-sm transition-colors focus-ring",
            "bg-[color:var(--color-bg-0)] text-[color:var(--color-text)]",
            "border-[color:var(--color-border)] focus:border-[color:var(--color-accent)]",
            "placeholder:text-[color:var(--color-text-mute)]",
            icon ? "pl-9 pr-3" : "px-3",
            error && "border-[color:var(--color-danger)]",
            className,
          )}
          {...rest}
        />
      </div>
      {hint && !error && (
        <p className="text-xs text-[color:var(--color-text-mute)]">{hint}</p>
      )}
      {error && <p className="text-xs text-[color:var(--color-danger)]">{error}</p>}
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
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-dim)]"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "w-full rounded-lg border text-sm transition-colors focus-ring resize-none",
          "bg-[color:var(--color-bg-0)] text-[color:var(--color-text)]",
          "border-[color:var(--color-border)] focus:border-[color:var(--color-accent)]",
          "placeholder:text-[color:var(--color-text-mute)] p-3",
          error && "border-[color:var(--color-danger)]",
          className,
        )}
        {...rest}
      />
      {error && <p className="text-xs text-[color:var(--color-danger)]">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, className, id, children, ...rest }: SelectProps) {
  const inputId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-dim)]"
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          "w-full h-10 rounded-lg border text-sm transition-colors focus-ring px-3",
          "bg-[color:var(--color-bg-0)] text-[color:var(--color-text)]",
          "border-[color:var(--color-border)] focus:border-[color:var(--color-accent)]",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <div className={cn("flex items-center gap-3 my-2", className)}>
        <div className="flex-1 h-px bg-[color:var(--color-border)]" />
        <span className="text-xs text-[color:var(--color-text-mute)] font-medium">{label}</span>
        <div className="flex-1 h-px bg-[color:var(--color-border)]" />
      </div>
    );
  }
  return <div className={cn("my-2 h-px bg-[color:var(--color-border)]", className)} />;
}

interface BadgeProps {
  count: number;
  className?: string;
}

export function Badge({ count, className }: BadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full",
        "bg-[color:var(--color-danger)] text-white text-[10px] font-bold",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ label, children, side = "right" }: TooltipProps) {
  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };
  return (
    <div className="relative group">
      {children}
      <div
        className={cn(
          "absolute z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity",
          "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
          "bg-[color:var(--color-bg-4)] text-[color:var(--color-text)] border border-[color:var(--color-border)]",
          positions[side],
        )}
      >
        {label}
      </div>
    </div>
  );
}
