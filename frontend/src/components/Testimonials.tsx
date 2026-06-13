"use client";

import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns-1";
import { motion } from "motion/react";

const testimonials: Testimonial[] = [
  {
    text: "Praxis felt like having a cofounder on call at 2am. It helped me sharpen my pitch before I ever spoke to an investor.",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Aastha Shrestha",
    role: "Founder, AgriLink",
  },
  {
    text: "I found two government grants I had no idea I qualified for, and Praxis walked me through the whole application.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Bishal Thapa",
    role: "Cofounder, KhetiTech",
  },
  {
    text: "The project checklists turned a vague idea into a week-by-week plan. We finally stopped guessing what to do next.",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Sneha Karki",
    role: "CEO, Lumbini Labs",
  },
  {
    text: "It understands Nepal's startup landscape in a way generic AI tools just don't. The grant guidance alone paid for itself.",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "Rohan Maharjan",
    role: "Founder, Sajilo Pay",
  },
  {
    text: "We validated our idea, mapped our go-to-market, and drafted our first deck in a single afternoon with Praxis.",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Prerana Joshi",
    role: "Cofounder, EduNiti",
  },
  {
    text: "As a solo founder, the brainstorming felt genuinely collaborative. It pushes back on weak ideas instead of agreeing with everything.",
    image: "https://randomuser.me/api/portraits/men/6.jpg",
    name: "Anil Gurung",
    role: "Founder, Himal Logistics",
  },
  {
    text: "Keeping my grants, todos, and saved chats in one workspace meant nothing fell through the cracks during our fundraise.",
    image: "https://randomuser.me/api/portraits/women/7.jpg",
    name: "Manisha Rai",
    role: "COO, FreshCart NP",
  },
  {
    text: "The answers are grounded and practical, not fluffy. It actually cited the funds and steps relevant to my sector.",
    image: "https://randomuser.me/api/portraits/men/8.jpg",
    name: "Kiran Adhikari",
    role: "Founder, SolarSathi",
  },
  {
    text: "Praxis is the first tool I open every morning. It's like a cofounder, mentor, and grants desk rolled into one.",
    image: "https://randomuser.me/api/portraits/women/9.jpg",
    name: "Dipika Lama",
    role: "CEO, CraftKtm",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export const Testimonials = () => {
  return (
    <section className="bg-background py-20 relative">
      <div className="container z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border border-white/15 text-white/70 py-1 px-4 rounded-lg text-sm">
              Feedback
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter mt-5 text-center text-white">
            What founders say
          </h2>
          <p className="text-center mt-5 text-white/55">
            Builders across Nepal are shipping faster with Praxis as their AI cofounder.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};
