"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape (desktop/keyboard parity with the tap-outside behavior).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Portal to <body> so the fixed overlay is positioned relative to the
  // viewport, escaping any transformed ancestor (e.g. the page-transition
  // wrapper) that would otherwise anchor it off-screen.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm flex items-start justify-center p-4 pt-12 animate-overlay-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-bg-1/95 border border-border-2/60 rounded-2xl shadow-lift w-full ${
          wide ? "max-w-2xl" : "max-w-md"
        } flex flex-col max-h-[calc(100vh-4rem)] overflow-hidden animate-modal-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border bg-bg-1/95 backdrop-blur-md rounded-t-2xl">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-3 hover:text-text-1 hover:bg-bg-3 rounded-md p-1 -mr-1 transition-colors active:scale-90"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
