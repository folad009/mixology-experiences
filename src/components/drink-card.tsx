"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import type { ReactNode } from "react";

type DrinkCardProps = {
  title: string;
  description: string;
  selected?: boolean;
  onClick?: () => void;
  visual?: ReactNode;
};

export function DrinkCard({ title, description, selected, onClick, visual }: DrinkCardProps) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={clsx(
        "w-full rounded-3xl border p-4 text-left transition sm:p-5",
        "backdrop-blur-xl bg-white/10 border-white/20 shadow-[0_12px_30px_rgba(30,18,8,0.22)]",
        selected ? "ring-2 ring-amber-200 border-amber-100/70" : "hover:border-amber-100/50",
      )}
    >
      {visual}
      <h3 className="text-lg font-semibold text-amber-50">{title}</h3>
      <p className="mt-2 text-sm text-amber-100/80">{description}</p>
    </motion.button>
  );
}
