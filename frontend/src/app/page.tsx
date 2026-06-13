"use client";

import { useRouter } from "next/navigation";
import { PrismaHero } from "@/components/ui/prisma-hero";
import SkewCards from "@/components/ui/gradient-card-showcase";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/ui/footer";

export default function Landing() {
  const router = useRouter();
  return (
    <main className="relative w-full bg-[#070709]">
      <PrismaHero onStart={() => router.push("/chat")} />
      <SkewCards />
      <Testimonials />
      <Footer />
    </main>
  );
}
