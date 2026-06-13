"use client";

import React from "react";
import { Award, Banknote, Users, ArrowUpRight } from "lucide-react";

interface Grant {
  name:        string;
  authority:   string;
  amount:      string;
  eligibility: string;
  description: string;
  sectors:     string[];
}

// Nepal government grants, loans, and entrepreneur funds.
const GRANTS: Grant[] = [
  {
    name:        "IEDI Startup Loan",
    authority:   "Industrial Enterprise Development Institute",
    amount:      "Up to NPR 2.5M",
    eligibility: "Ages 18–40",
    description: "Concessional startup loan for young entrepreneurs building manufacturing or service businesses.",
    sectors:     ["Manufacturing", "Service"],
  },
  {
    name:        "Youth Self Employment Fund",
    authority:   "YSEF · Ministry of Finance",
    amount:      "NPR 0.5M – 2M",
    eligibility: "Under 40",
    description: "Seed financing to help young Nepalis launch their first venture in any sector.",
    sectors:     ["Any sector"],
  },
  {
    name:        "Women Entrepreneurship Fund",
    authority:   "Government of Nepal",
    amount:      "Up to NPR 1.5M",
    eligibility: "Women-led businesses",
    description: "Dedicated funding to support and scale businesses founded and led by women.",
    sectors:     ["Any sector"],
  },
  {
    name:        "Business Incubation Support",
    authority:   "FNCCI",
    amount:      "Mentorship + seed funding",
    eligibility: "Tech & innovation startups",
    description: "Incubation program pairing early-stage founders with mentorship and seed capital.",
    sectors:     ["Technology", "Innovation"],
  },
  {
    name:        "Startup Nepal Grant",
    authority:   "Nepal ICT Board",
    amount:      "Up to NPR 1M",
    eligibility: "ICT / software startups",
    description: "Grant for software and ICT startups to build and ship their products.",
    sectors:     ["ICT", "Software"],
  },
  {
    name:        "Agricultural Development Grant",
    authority:   "Ministry of Agriculture (MoALD)",
    amount:      "Grant funding",
    eligibility: "Agri-tech & food businesses",
    description: "Support for agri-tech, farming, and food-processing enterprises across Nepal.",
    sectors:     ["Agriculture", "Food"],
  },
  {
    name:        "Manufacturing Development Fund",
    authority:   "Government of Nepal",
    amount:      "Up to NPR 5M",
    eligibility: "Import-substitution products",
    description: "Financing for manufacturers producing goods that reduce reliance on imports.",
    sectors:     ["Manufacturing"],
  },
  {
    name:        "Export Promotion Fund",
    authority:   "Trade & Export Promotion Centre",
    amount:      "Sector-based support",
    eligibility: "Export-ready businesses",
    description: "Helps businesses with export potential expand into international markets.",
    sectors:     ["Export"],
  },
  {
    name:        "Enterprise Development Program",
    authority:   "Government of Nepal (EDP)",
    amount:      "Skills + micro-loans",
    eligibility: "Early-stage entrepreneurs",
    description: "Combines entrepreneurship training with micro-loans for new founders.",
    sectors:     ["Early-stage"],
  },
];

const GrantCard: React.FC<{ grant: Grant }> = ({ grant }) => (
  <div className="group relative flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 p-5 transition-all">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
        <Award className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-white font-semibold text-sm leading-snug truncate">{grant.name}</h3>
        <p className="text-white/40 text-xs mt-0.5 truncate">{grant.authority}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-violet-400 transition-colors flex-shrink-0" />
    </div>

    <p className="text-white/60 text-xs leading-relaxed">{grant.description}</p>

    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
      <span className="flex items-center gap-1.5 text-violet-300">
        <Banknote className="w-3.5 h-3.5" />
        {grant.amount}
      </span>
      <span className="flex items-center gap-1.5 text-white/45">
        <Users className="w-3.5 h-3.5" />
        {grant.eligibility}
      </span>
    </div>

    <div className="flex flex-wrap gap-1.5 mt-0.5">
      {grant.sectors.map((s) => (
        <span
          key={s}
          className="text-[10px] font-medium text-white/55 bg-white/8 border border-white/10 px-2 py-0.5 rounded-full"
        >
          {s}
        </span>
      ))}
    </div>
  </div>
);

export const GrantsPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#16171a] flex-shrink-0">
        <div>
          <h1 className="text-white font-semibold text-lg">Grants</h1>
          <p className="text-white/40 text-xs">
            {GRANTS.length} Nepal government grants &amp; funds for entrepreneurs
          </p>
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GRANTS.map((grant) => (
              <GrantCard key={grant.name} grant={grant} />
            ))}
          </div>

          <p className="text-white/25 text-[11px] text-center mt-6">
            Details are indicative — always verify amounts and eligibility with the issuing body.
          </p>
        </div>
      </div>
    </div>
  );
};
