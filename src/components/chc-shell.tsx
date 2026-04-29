"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function ChcShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col overflow-hidden px-4 py-6 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(172, 89, 249,0.25)_0,transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 flex flex-1 flex-col"
      >
        {children}
      </motion.div>
    </main>
  );
}
