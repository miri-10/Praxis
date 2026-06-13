"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface FeatureCardProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  bullets?: string[];
  glowColor?: string;
  borderFrom?: string;
  borderTo?: string;
  highlightColor?: string;
  href?: string;
  className?: string;
}

export const FeatureCard = ({
  title,
  description,
  bullets = [],
  href = "/chat",
  className,
}: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative flex flex-col items-center text-center gap-6 p-10 rounded-2xl overflow-hidden min-h-[320px] justify-center",
        "bg-[#0f1011] border border-white/[0.07]",
        "hover:border-white/[0.14] hover:-translate-y-1 transition-all duration-300",
        className
      )}
    >
      {/* Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/10" />

      {/* Text */}
      <div className="relative z-10 flex flex-col gap-3">
        <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
        <p className="text-sm text-white/45 leading-relaxed">{description}</p>
      </div>

      {/* Bullets */}
      {bullets.length > 0 && (
        <ul className="relative z-10 flex flex-col gap-2 w-full text-left">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-white/40">
              <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/25" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Divider */}
      <div className="relative z-10 w-full h-px bg-white/[0.06]" />

      {/* CTA */}
      <a
        href={href}
        className="relative z-10 text-sm text-white/40 hover:text-white/75 transition-colors group-hover:text-white/60"
      >
        Get started →
      </a>
    </motion.div>
  );
};
