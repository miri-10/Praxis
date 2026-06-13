"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { CardStack, CardStackItem } from "@/components/ui/card-stack";

interface GrantCardItem extends CardStackItem {
  authority:   string;
  amount:      string;
  eligibility: string;
  sectors:     string[];
}

const GRANTS: GrantCardItem[] = [
  {
    id: 1,
    title: "IEDI Startup Loan",
    tag: "Concessional Loan",
    description:
      "Nepal's flagship concessional loan for young founders aged 18–40. Covers equipment procurement, working capital, and initial operations. Apply through your nearest IEDI district office with a business plan and projected cash flow.",
    authority:   "Industrial Enterprise Development Institute",
    amount:      "Up to NPR 2.5M",
    eligibility: "Ages 18–40",
    sectors:     ["Manufacturing", "Service"],
  },
  {
    id: 2,
    title: "Youth Self Employment Fund",
    tag: "Seed Capital",
    description:
      "Seed financing from the Ministry of Finance designed to help young Nepalis launch their first venture. Open to any sector with emphasis on job creation. Applications accepted bi-annually through district employment offices.",
    authority:   "YSEF · Ministry of Finance",
    amount:      "NPR 0.5M – 2M",
    eligibility: "Under 40",
    sectors:     ["Any sector"],
  },
  {
    id: 3,
    title: "Women Entrepreneurship Fund",
    tag: "Dedicated Grant",
    description:
      "Government-backed fund to support and scale women-led businesses across Nepal. Covers startup costs, expansion capital, and skills development. No collateral required for amounts below NPR 300K — ideal for first-time founders.",
    authority:   "Government of Nepal",
    amount:      "Up to NPR 1.5M",
    eligibility: "Women-led businesses",
    sectors:     ["Any sector"],
  },
  {
    id: 4,
    title: "Business Incubation Support",
    tag: "Incubation Program",
    description:
      "FNCCI's flagship program pairing early-stage tech founders with experienced mentors and seed capital. Cohorts of 15–20 startups receive 6-month intensive support including legal guidance, market access help, and investor introductions.",
    authority:   "FNCCI",
    amount:      "Mentorship + seed funding",
    eligibility: "Tech & innovation startups",
    sectors:     ["Technology", "Innovation"],
  },
  {
    id: 5,
    title: "Startup Nepal Grant",
    tag: "ICT Grant",
    description:
      "Non-dilutive grant from Nepal ICT Board for software and ICT startups at product stage. Supports prototyping, MVP development, and early go-to-market activities. Strong preference for products addressing domestic market challenges.",
    authority:   "Nepal ICT Board",
    amount:      "Up to NPR 1M",
    eligibility: "ICT / software startups",
    sectors:     ["ICT", "Software"],
  },
  {
    id: 6,
    title: "Agricultural Development Grant",
    tag: "Agri Support",
    description:
      "MoALD financing for agri-tech innovation, farming modernisation, and food-processing enterprises. Priority given to climate-resilient agriculture and value-chain improvements that directly benefit smallholder farmers across Nepal.",
    authority:   "Ministry of Agriculture (MoALD)",
    amount:      "Grant funding",
    eligibility: "Agri-tech & food businesses",
    sectors:     ["Agriculture", "Food"],
  },
  {
    id: 7,
    title: "Manufacturing Development Fund",
    tag: "Industrial Finance",
    description:
      "Substantial financing facility for manufacturers producing import-substitution goods. Covers plant setup, machinery purchase, and raw material procurement. Environmental compliance documentation and feasibility study required at application stage.",
    authority:   "Government of Nepal",
    amount:      "Up to NPR 5M",
    eligibility: "Import-substitution products",
    sectors:     ["Manufacturing"],
  },
  {
    id: 8,
    title: "Export Promotion Fund",
    tag: "Trade Support",
    description:
      "TEPC program helping export-ready Nepali businesses access international markets. Covers trade fair participation, product certification costs, and packaging redesign for export standards. Rolling applications accepted year-round.",
    authority:   "Trade & Export Promotion Centre",
    amount:      "Sector-based support",
    eligibility: "Export-ready businesses",
    sectors:     ["Export"],
  },
  {
    id: 9,
    title: "Enterprise Development Program",
    tag: "Micro-finance",
    description:
      "Combines structured entrepreneurship training with micro-loans for first-time founders. A 3-month curriculum covers business planning, financial management, and legal compliance — followed by direct loan disbursement with favourable terms.",
    authority:   "Government of Nepal (EDP)",
    amount:      "Skills + micro-loans",
    eligibility: "Early-stage entrepreneurs",
    sectors:     ["Early-stage"],
  },
];

const SECTOR_STYLE: Record<string, { bar: string; amount: string }> = {
  Manufacturing: { bar: "from-orange-500/60 to-amber-500/30",  amount: "text-orange-300" },
  Service:       { bar: "from-violet-500/60 to-purple-500/30", amount: "text-violet-300" },
  ICT:           { bar: "from-blue-500/60 to-cyan-500/30",     amount: "text-blue-300"   },
  Software:      { bar: "from-blue-500/60 to-cyan-500/30",     amount: "text-blue-300"   },
  Technology:    { bar: "from-cyan-500/60 to-blue-500/30",     amount: "text-cyan-300"   },
  Innovation:    { bar: "from-cyan-500/60 to-blue-500/30",     amount: "text-cyan-300"   },
  Agriculture:   { bar: "from-green-500/60 to-emerald-500/30", amount: "text-green-300"  },
  Food:          { bar: "from-green-500/60 to-emerald-500/30", amount: "text-green-300"  },
  Export:        { bar: "from-teal-500/60 to-cyan-500/30",     amount: "text-teal-300"   },
  "Early-stage": { bar: "from-indigo-500/60 to-violet-500/30", amount: "text-indigo-300" },
  "Any sector":  { bar: "from-violet-500/60 to-blue-500/30",   amount: "text-violet-300" },
};

const DEFAULT_STYLE = { bar: "from-violet-500/60 to-blue-500/30", amount: "text-violet-300" };

function getSectorStyle(sectors: string[]) {
  for (const s of sectors) {
    if (SECTOR_STYLE[s]) return SECTOR_STYLE[s];
  }
  return DEFAULT_STYLE;
}

function renderGrantCard(item: GrantCardItem, { active }: { active: boolean }): React.ReactNode {
  const style = getSectorStyle(item.sectors);

  return (
    <div className="relative h-full w-full bg-[#0c0d10] flex flex-col overflow-hidden">
      {/* Accent bar */}
      <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${style.bar}`} />
      {/* Subtle top glow */}
      <div className={`absolute top-0 inset-x-0 h-28 bg-gradient-to-b ${style.bar} opacity-10 pointer-events-none`} />

      <div className="relative flex flex-col h-full p-6 gap-3 z-10">
        {/* Category tag */}
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
          {item.tag}
        </span>

        {/* Title + amount */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base leading-snug">{item.title}</h3>
            <p className="text-white/30 text-xs mt-0.5 truncate">{item.authority}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className={`font-semibold text-sm ${style.amount}`}>{item.amount}</p>
            <p className="text-white/25 text-[11px] mt-0.5">{item.eligibility}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-white/45 text-xs leading-relaxed line-clamp-3 flex-1">
          {item.description}
        </p>

        {/* Sector pills */}
        <div className="flex flex-wrap gap-1.5">
          {item.sectors.map((s) => (
            <span
              key={s}
              className="text-[10px] font-medium text-white/35 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-[11px] text-white/20 flex items-center gap-1">
            Ask Praxis about eligibility
            <ArrowRight className="w-3 h-3" />
          </span>
          {active && (
            <span className="text-[10px] text-white/15 hidden sm:block">drag or click to browse</span>
          )}
        </div>
      </div>
    </div>
  );
}

export const GrantsPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      {/* Page header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-5">
        <h1 className="text-white font-semibold text-2xl tracking-tight">Grants & Funding</h1>
      </div>

      {/* Card stack */}
      <div className="flex-1 overflow-hidden flex flex-col justify-center min-h-0 px-4 pb-4">
        <CardStack<GrantCardItem>
          items={GRANTS}
          initialIndex={0}
          maxVisible={5}
          cardWidth={460}
          cardHeight={310}
          overlap={0.52}
          spreadDeg={42}
          depthPx={100}
          activeLiftPx={18}
          showDots={true}
          loop={true}
          autoAdvance={false}
          renderCard={renderGrantCard}
        />
        <p className="text-white/20 text-[11px] text-center mt-3">
          Details are indicative — always verify amounts and eligibility with the issuing body.
        </p>
      </div>
    </div>
  );
};
