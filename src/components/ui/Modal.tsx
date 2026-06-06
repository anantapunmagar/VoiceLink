import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
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
    full: "max-w-5xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={cn(
          "relative w-full rounded-2xl border border-[color:var(--color-border)] slide-up",
          "bg-[color:var(--color-bg-2)] shadow-2xl overflow-hidden",
          sizes[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
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
    <div className="flex items-start justify-between p-6 pb-4 border-b border-[color:var(--color-border)]">
      <div>
        <h2 className="text-base font-semibold text-[color:var(--color-text)]">{title}</h2>
        {subtitle && (
          <p className="text-sm text-[color:var(--color-text-dim)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 p-1.5 rounded-lg text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-3)] transition-colors focus-ring"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
