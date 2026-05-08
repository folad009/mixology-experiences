"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import type { Order } from "@/lib/types";

export type PreparationCountdownProps = {
  order: Order;
  className?: string;
};

export function PreparationCountdown({ order, className }: PreparationCountdownProps) {
  if (!Number.isFinite(order.preparationSeconds)) {
    return <span className={clsx("text-amber-100/50", className)}>—</span>;
  }

  const [remainingSeconds, setRemainingSeconds] = useState(() => Math.max(0, Math.trunc(order.preparationSeconds)));

  useEffect(() => {
    setRemainingSeconds(Math.max(0, Math.trunc(order.preparationSeconds)));
  }, [order.id, order.preparationSeconds]);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remainingSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const minuteLabel = `${minutes} ${minutes === 1 ? "min" : "mins"}`;
  const secondLabel = `${seconds} ${seconds === 1 ? "sec" : "secs"}`;
  const timeLabel = `${minuteLabel} ${secondLabel}`;

  return (
    <span className={clsx(className)} aria-label={`Estimated preparation time: ${timeLabel}`}>
      {timeLabel}
    </span>
  );
}
