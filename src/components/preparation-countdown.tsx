"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import type { Order } from "@/lib/types";

/** Prep window from order creation (2-minute SLA). */
const PREPARATION_MS = 2 * 60 * 1000;

function formatPrepRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export type PreparationCountdownProps = {
  order: Order;
  className?: string;
};

export function PreparationCountdown({ order, className }: PreparationCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (order.status === "Completed") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [order.status, order.id]);

  if (order.status === "Completed") {
    return <span className={clsx("text-amber-100/50", className)}>—</span>;
  }

  const start = new Date(order.createdAt).getTime();
  if (Number.isNaN(start)) {
    return <span className={clsx("text-amber-100/50", className)}>—</span>;
  }

  const remaining = start + PREPARATION_MS - now;
  const overdue = remaining <= 0;

  return (
    <span
      className={clsx(overdue && "font-medium text-rose-300", className)}
      aria-label={overdue ? "Preparation time exceeded" : `${formatPrepRemaining(remaining)} remaining`}
    >
      {formatPrepRemaining(remaining)}
    </span>
  );
}
