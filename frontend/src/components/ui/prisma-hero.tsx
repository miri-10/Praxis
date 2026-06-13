"use client";

import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { InteractiveRobotSpline } from "@/components/ui/interactive-3d-robot";

const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- WordsPullUpMultiStyle ---------------- */
interface Segment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
  style?: React.CSSProperties;
}

export const WordsPullUpMultiStyle = ({ segments, className = "", style }: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${w.className ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------------- Hero ---------------- */
interface PrismaHeroProps {
  onStart?: () => void;
}

const PrismaHero = ({ onStart }: PrismaHeroProps) => {
  return (
    <section className="h-screen w-full bg-[#070709]">
      <div className="relative h-full w-full overflow-hidden">

        {/* Dark base + drifting violet/blue aura (matches the chat app) */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(120% 120% at 50% 50%, #101117 0%, #0a0a0d 55%, #070709 100%)" }}
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute left-[6%] top-[18%] h-[55vh] w-[40vw] rounded-full animate-[auraFloatA_19s_ease-in-out_infinite]"
            style={{ filter: "blur(80px)", background: "radial-gradient(closest-side, rgba(140,95,250,0.45) 0%, transparent 100%)" }}
          />
          <div
            className="absolute left-[54%] top-[28%] h-[45vh] w-[48vw] rounded-full animate-[auraFloatB_26s_ease-in-out_infinite]"
            style={{ filter: "blur(90px)", background: "radial-gradient(closest-side, rgba(70,115,245,0.40) 0%, transparent 100%)" }}
          />
        </div>

        {/* Gradient overlay for legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />

        {/* Announcement bar */}
        <div className="absolute left-0 right-0 top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur-sm">
          <p className="py-2 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-white/55 sm:text-xs">
            Now in early access · Praxis is your{" "}
            <span className="text-violet-300">AI cofounder</span> for building{" "}
            <span className="text-violet-300">Nepal</span> startups — start today.
          </p>
        </div>

        {/* Interactive 3D robot — fills the hero so it reaches the bottom edge */}
        <div className="pointer-events-auto absolute inset-0 z-[2]">
          <InteractiveRobotSpline scene={ROBOT_SCENE_URL} className="h-full w-full" />
          {/* Cover the baked-in "Built with Spline" watermark (bottom-right) */}
          <div className="pointer-events-none absolute bottom-2 right-2 z-[3] h-11 w-48 rounded-md bg-[#070709]" />
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-2 sm:px-6 md:px-10">
          <div className="grid grid-cols-12 items-end gap-4">

            <div className="col-span-12 lg:col-span-8">
              <h1 className="font-medium leading-[0.85] tracking-[-0.07em] text-white text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw]">
                <WordsPullUp text="Praxis" showAsterisk />
              </h1>
            </div>

            <div className="col-span-12 flex flex-col gap-5 pb-6 lg:col-span-4 lg:pb-10">

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs text-white/70 sm:text-sm md:text-base"
                style={{ lineHeight: 1.3 }}
              >
                Praxis is your AI cofounder — brainstorm ideas, shape strategy, navigate
                Nepal&apos;s startup grants, and build your company, all in one place.
              </motion.p>

              <motion.button
                onClick={onStart}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="group inline-flex items-center gap-2 self-start rounded-full bg-white py-1 pl-5 pr-1 text-sm font-medium text-black transition-all hover:gap-3 sm:text-base"
              >
                Start chat
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                  <ArrowRight className="h-4 w-4 text-white" />
                </span>
              </motion.button>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { PrismaHero };
