import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  closeOnBackdrop?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  size = "md",
  className,
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-xl",
    xl: "max-w-3xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className={cn(
          "relative w-full rounded-xl bg-[color:var(--color-bg-2)] border border-[color:var(--color-border)]",
          "shadow-2xl slide-up overflow-hidden",
          sizes[size],
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
}

export function ModalHeader({ title, subtitle, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between px-6 pt-6 pb-4">
      <div>
        <h2 className="text-xl font-semibold text-[color:var(--color-text)] tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[color:var(--color-text-dim)]">{subtitle}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1.5 -mr-1.5 -mt-1.5 rounded-md text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-3)] transition-colors focus-ring"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
