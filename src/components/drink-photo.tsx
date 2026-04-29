"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type DrinkPhotoProps = {
  src: string;
  alt: string;
};

export function DrinkPhoto({ src, alt }: DrinkPhotoProps) {
  return (
    <div className="relative mb-3 h-60 w-full overflow-hidden rounded-2xl border border-white/15">
      <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.4 }} className="relative h-full w-full">
        <Image src={src} alt={alt} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-white/10" />
    </div>
  );
}

