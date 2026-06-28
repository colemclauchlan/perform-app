"use client";

import React, { useState } from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Uppercase mono eyebrow rendered at the top of the card. */
  title?: React.ReactNode;
  /** Node placed at the top-right (e.g. a "View all →" link or button). */
  action?: React.ReactNode;
  /** Adds hover border-lift + soft blue glow + pointer cursor. */
  interactive?: boolean;
  /** Show an animated −/+ minimize toggle. Defaults to true when `title` is set. */
  collapsible?: boolean;
  /** Initial expanded state when collapsible. Default true. */
  defaultOpen?: boolean;
  pad?: "none" | "sm" | "md" | "lg";
}

function ToggleBtn({ open, onClick }: { open: boolean; onClick: (e: React.MouseEvent) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      aria-label={open ? "Minimize" : "Maximize"}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 26,
        height: 26,
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--r-sm)",
        cursor: "pointer",
        background: hover ? "var(--accent-dim)" : "transparent",
        border: "1px solid " + (hover ? "rgba(24,155,245,0.4)" : "var(--line)"),
        color: hover ? "var(--accent-bright)" : "var(--text-3)",
        transition: "all var(--dur)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M5 12h14" />
        {!open && <path d="M12 5v14" />}
      </svg>
    </button>
  );
}

/**
 * BodyTrack:AI · Vital Signal — surface container, the base unit of every layout.
 * Surface tint + 1px hairline, no heavy shadow on dark. Titled cards are collapsible
 * by default. Ported from design-system/components/core/Card.
 */
export function Card({
  children,
  title,
  action,
  interactive = false,
  collapsible,
  defaultOpen = true,
  pad = "md",
  style = {},
  ...rest
}: CardProps) {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const pads = ({ none: 0, sm: 12, md: 16, lg: 20 } as const)[pad] ?? 16;
  const canCollapse = collapsible != null ? collapsible : title != null;
  const hasHeader = title || action || canCollapse;

  return (
    <div
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        background: "var(--surface-card)",
        border: "1px solid " + (hover ? "var(--line-2)" : "var(--line)"),
        borderRadius: "var(--r-lg)",
        padding: pads,
        transition: "border-color var(--dur), box-shadow var(--dur)",
        boxShadow: hover ? "var(--glow-blue-soft)" : "none",
        cursor: interactive ? "pointer" : "default",
        ...style,
      }}
      {...rest}
    >
      {hasHeader && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: open ? 12 : 0,
            gap: 8,
            transition: "margin var(--dur)",
          }}
        >
          {title ? (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--text-3)",
              }}
            >
              {title}
            </span>
          ) : (
            <span />
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {action}
            {canCollapse && (
              <ToggleBtn
                open={open}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((o) => !o);
                }}
              />
            )}
          </div>
        </div>
      )}
      {canCollapse ? (
        <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 0.32s var(--ease-out)" }}>
          <div style={{ overflow: "hidden", minHeight: 0 }}>{children}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
