"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function ChcShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: "url('/images/chc-background-new.png')",
          backgroundPosition: "right center",
          backgroundSize: "auto 100%",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(172,89,249,0.34)_0,transparent_58%)] md:bg-[radial-gradient(circle_at_top,rgba(172,89,249,0.24)_0,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[#2d0b59]/45 md:bg-[#2d0b59]/30" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col px-2 py-6 sm:px-8"
      >
        {children}
      </motion.div>
    </main>
  );
}
