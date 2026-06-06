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

export function Modal({ open, onClose, children, size = "md", className, closeOnBackdrop = true }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const maxW = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl", full: "max-w-4xl" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={cn(
          "relative w-full rounded-xl border border-[color:var(--color-border)] overflow-hidden animate-scale-in shadow-2xl",
          "bg-[color:var(--color-bg-3)]",
          maxW[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose?: () => void }) {
  return (
    <div className="flex items-start justify-between p-5 border-b border-[color:var(--color-border)]">
      <div>
        <h2 className="text-base font-semibold text-[color:var(--color-text)]">{title}</h2>
        {subtitle && <p className="text-sm text-[color:var(--color-text-dim)] mt-0.5">{subtitle}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="ml-4 p-1.5 rounded-lg text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-5)] transition-colors">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
