"use client";

import React, { useState } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "mint" | "danger";
  size?: "sm" | "md" | "lg";
  /** Leading icon node (e.g. a Lucide icon element). */
  icon?: React.ReactNode;
  /** Trailing icon node. */
  iconRight?: React.ReactNode;
}

/**
 * BodyTrack:AI · Vital Signal — primary action control.
 * Calibrated, precise, no bounce. Ported from design-system/components/core/Button.
 * Variants: primary (blue current gradient), ghost (steel outline), mint (on-track,
 * rationed), danger. Renders correctly inside a `.vital-signal` token scope.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  icon = null,
  iconRight = null,
  disabled = false,
  type = "button",
  style = {},
  ...rest
}: ButtonProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const sizes = {
    sm: { padding: "6px 12px", fontSize: 12, gap: 6, h: 30, icon: 14 },
    md: { padding: "9px 16px", fontSize: 13, gap: 7, h: 38, icon: 16 },
    lg: { padding: "12px 22px", fontSize: 15, gap: 8, h: 46, icon: 18 },
  } as const;
  const s = sizes[size] || sizes.md;

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    padding: s.padding,
    minHeight: s.h,
    fontFamily: "var(--font-ui)",
    fontSize: s.fontSize,
    fontWeight: 600,
    letterSpacing: "0.01em",
    borderRadius: "var(--r-md)",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition:
      "background var(--dur), border-color var(--dur), color var(--dur), box-shadow var(--dur), transform var(--dur-fast)",
    transform: active && !disabled ? "translateY(1px)" : "none",
    whiteSpace: "nowrap",
    userSelect: "none",
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: active ? "var(--accent-press)" : hover ? "#1f86df" : "var(--grad-current)",
      color: "#fff",
      boxShadow: hover && !disabled ? "var(--glow-blue-soft)" : "none",
    },
    ghost: {
      background: hover ? "var(--surface-3)" : "var(--surface-2)",
      color: hover ? "var(--text-1)" : "var(--text-2)",
      borderColor: hover ? "var(--line-2)" : "var(--line)",
    },
    mint: {
      background: hover ? "rgba(47,227,168,0.18)" : "var(--mint-dim)",
      color: "var(--mint)",
      borderColor: "rgba(47,227,168,0.4)",
    },
    danger: {
      background: hover ? "rgba(245,101,101,0.2)" : "var(--high-dim)",
      color: "var(--high)",
      borderColor: "rgba(245,101,101,0.3)",
    },
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{ ...base, ...variants[variant], ...style }}
      {...rest}
    >
      {icon && <span style={{ display: "inline-flex", width: s.icon, height: s.icon }}>{icon}</span>}
      {children}
      {iconRight && <span style={{ display: "inline-flex", width: s.icon, height: s.icon }}>{iconRight}</span>}
    </button>
  );
}
