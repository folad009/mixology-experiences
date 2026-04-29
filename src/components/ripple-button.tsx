"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function RippleButton({ className, children, ...props }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 px-5 py-3 font-semibold text-amber-950 shadow-[0_10px_35px_rgba(143,85,44,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute inset-0 bg-white/20 opacity-0 transition group-active:opacity-100" />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
