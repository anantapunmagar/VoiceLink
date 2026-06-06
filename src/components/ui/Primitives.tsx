import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';

// ---- Button ----
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'link';
type BtnSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  children: ReactNode;
}

const btnVariants: Record<BtnVariant, string> = {
  primary:
    'bg-[color:var(--color-accent)] text-white hover:bg-[color:var(--color-accent-hover)] active:brightness-90',
  secondary:
    'bg-[color:var(--color-bg-5)] text-[color:var(--color-text)] hover:bg-[color:var(--color-border-strong)]',
  ghost:
    'text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-5)]',
  danger:
    'bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/20',
  success:
    'bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] hover:bg-[color:var(--color-success)]/25',
  link: 'text-[color:var(--color-accent)] hover:underline p-0 h-auto',
};
const btnSizes: Record<BtnSize, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-md',
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-9 px-4 text-sm rounded-lg',
  lg: 'h-11 px-5 text-sm rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 select-none whitespace-nowrap focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
        variant !== 'link' && btnSizes[size],
        btnVariants[variant],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" /> Please wait...
        </>
      ) : (
        children
      )}
    </button>
  );
}

// ---- Input ----
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export function Input({ label, error, hint, icon, className, id, ...rest }: InputProps) {
  const inputId = id ?? rest.name;
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
            'w-full h-9 rounded-lg border text-sm bg-[color:var(--color-bg-2)] text-[color:var(--color-text)]',
            'border-[color:var(--color-border)] focus:border-[color:var(--color-accent)] placeholder:text-[color:var(--color-text-mute)]',
            'transition-colors focus:outline-none',
            icon ? 'pl-9 pr-3' : 'px-3',
            error && 'border-[color:var(--color-danger)]',
            className
          )}
          {...rest}
        />
      </div>
      {hint && !error && <p className="text-xs text-[color:var(--color-text-mute)]">{hint}</p>}
      {error && <p className="text-xs text-[color:var(--color-danger)]">{error}</p>}
    </div>
  );
}

// ---- Textarea ----
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...rest }: TextareaProps) {
  const inputId = id ?? rest.name;
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
          'w-full rounded-lg border text-sm bg-[color:var(--color-bg-2)] text-[color:var(--color-text)]',
          'border-[color:var(--color-border)] focus:border-[color:var(--color-accent)] placeholder:text-[color:var(--color-text-mute)]',
          'transition-colors focus:outline-none resize-none p-3',
          error && 'border-[color:var(--color-danger)]',
          className
        )}
        {...rest}
      />
      {error && <p className="text-xs text-[color:var(--color-danger)]">{error}</p>}
    </div>
  );
}

// ---- Divider ----
export function Divider({ label, className }: { label?: string; className?: string }) {
  if (label)
    return (
      <div className={cn('flex items-center gap-3 my-1', className)}>
        <div className="flex-1 h-px bg-[color:var(--color-border)]" />
        <span className="text-xs text-[color:var(--color-text-mute)]">{label}</span>
        <div className="flex-1 h-px bg-[color:var(--color-border)]" />
      </div>
    );
  return <div className={cn('h-px bg-[color:var(--color-border)] my-1', className)} />;
}

// ---- Badge ----
export function Badge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[color:var(--color-danger)] text-white text-[10px] font-bold',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

// ---- Toggle ----
export function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[color:var(--color-bg-4)]">
      <div>
        <p className="text-sm font-medium text-[color:var(--color-text)]">{label}</p>
        {description && (
          <p className="text-xs text-[color:var(--color-text-mute)] mt-0.5">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative w-10 h-5 rounded-full transition-colors flex-shrink-0',
          value ? 'bg-[color:var(--color-accent)]' : 'bg-[color:var(--color-bg-5)]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            value ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}
