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

  if (!open || !mounted) return null;

  // Portal to <body> so the fixed overlay is positioned relative to the
  // viewport, escaping any transformed ancestor (e.g. the page-transition
  // wrapper) that would otherwise anchor it off-screen.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-start justify-center overflow-y-auto p-4 pt-12 animate-overlay-in"
      onClick={onClose}
    >
      <div
        className={`bg-bg-1 border border-border rounded-xl w-full ${
          wide ? "max-w-2xl" : "max-w-md"
        } my-auto animate-modal-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-3 hover:text-text-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
