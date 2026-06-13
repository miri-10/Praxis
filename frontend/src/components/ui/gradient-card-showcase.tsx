"use client";

import { MessageSquare, Award, FolderKanban } from "lucide-react";
import { FeatureCard } from "@/components/ui/feature-card";
import { motion } from "framer-motion";

const cards = [
  {
    icon: <MessageSquare className="w-7 h-7 text-white/80" />,
    title: "AI Cofounder Chat",
    description:
      "Brainstorm ideas, pressure-test your strategy, and validate your startup with an AI cofounder that understands Nepal's ecosystem.",
    bullets: [
      "Ask anything about Nepal startup law",
      "Pressure-test your business model",
      "Get answers in Nepali or English",
    ],
    href: "/chat",
  },
  {
    icon: <Award className="w-7 h-7 text-white/80" />,
    title: "Grants & Funding",
    description:
      "Find the Nepal government grants and entrepreneur funds you actually qualify for — and get help preparing your application.",
    bullets: [
      "Browse grants you're eligible for",
      "AI-assisted application writing",
      "Track submission deadlines",
    ],
    href: "/chat",
  },
  {
    icon: <FolderKanban className="w-7 h-7 text-white/80" />,
    title: "Projects & Checklists",
    description:
      "Turn plans into action with project workspaces, AI-generated todo checklists, file uploads, and saved chats — all in one place.",
    bullets: [
      "Auto-generate compliance checklists",
      "Upload and organise documents",
      "Save answers for later reference",
    ],
    href: "/chat",
  },
];

export default function SkewCards() {
  return (
    <section className="relative bg-[#070709] py-24 px-4 overflow-hidden">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-2xl text-center mb-14"
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          Everything you need to build your startup
        </h2>
        <p className="mt-3 text-white/45 text-sm sm:text-base leading-relaxed">
          Praxis brings your cofounder, your funding research, and your execution plan together.
        </p>
      </motion.div>

      {/* Cards grid */}
      <div className="relative z-10 mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <FeatureCard key={idx} {...card} />
        ))}
      </div>
    </section>
  );
}
