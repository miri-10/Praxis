"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowUp, Heart } from "lucide-react";
import logo from "@/photo/logo.png";

const nav = [
  {
    heading: "Product",
    links: [
      { label: "AI Chat",     href: "/chat" },
      { label: "Projects",    href: "/chat" },
      { label: "Grants",      href: "/chat" },
      { label: "Saved Chats", href: "/chat" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Nepal Company Act",      href: "/chat" },
      { label: "FITTA 2019",             href: "/chat" },
      { label: "Industrial Business Act",href: "/chat" },
      { label: "Consumer Protection",    href: "/chat" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About",   href: "#" },
      { label: "Contact", href: "mailto:misanpokharel3@gmail.com" },
      { label: "Privacy", href: "#" },
      { label: "Terms",   href: "#" },
    ],
  },
];

const socials = [
  { icon: <Mail className="w-4 h-4" />, href: "mailto:misanpokharel3@gmail.com", label: "Email" },
];

function scrollTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function Footer() {
  return (
    <footer className="relative bg-[#070709] border-t border-white/[0.06]">
      {/* Top section */}
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-10 grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Brand */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex-shrink-0 rounded-lg overflow-hidden">
              <Image src={logo} alt="Praxis" width={28} height={28} className="object-contain" />
            </div>
            <span className="text-white font-semibold text-sm tracking-wide">Praxis</span>
          </div>
          <p className="text-white/35 text-xs leading-relaxed max-w-xs">
            Your AI cofounder for Nepal startups. Get legal guidance, find grants, manage projects,
            and build faster — in Nepali or English.
          </p>
          {/* Socials */}
          <div className="flex items-center gap-2 mt-1">
            {socials.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="p-2 rounded-xl border border-white/[0.07] text-white/35 hover:text-white/70 hover:border-white/[0.14] transition-all duration-200"
              >
                {s.icon}
              </Link>
            ))}
          </div>
        </div>

        {/* Nav columns */}
        {nav.map((col) => (
          <div key={col.heading} className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">
              {col.heading}
            </p>
            <ul className="flex flex-col gap-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-xs text-white/40 hover:text-white/75 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="h-px bg-white/[0.06]" />
      </div>

      {/* Bottom bar */}
      <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-white/25 text-xs flex items-center gap-1.5">
          © {new Date().getFullYear()} Praxis. Made with{" "}
          <Heart className="w-3 h-3 text-red-500/70 fill-red-500/70 animate-pulse" />
          {" "}in Nepal.
        </p>
        <button
          onClick={scrollTop}
          className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/60 transition-colors"
        >
          Back to top
          <ArrowUp className="w-3 h-3" />
        </button>
      </div>
    </footer>
  );
}
