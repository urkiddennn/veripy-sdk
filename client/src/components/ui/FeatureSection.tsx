import type React from "react";
import { Code, Zap, Search } from "lucide-react";

const FeatureSection: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-white">
            Everything you need to verify
          </h2>
          <p className="text-neutral-500 font-medium">
            Verification made simple, powerful, and fast.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="relative w-full md:w-[320px] bg-[#0c0c0c] border border-white/5 rounded-xl p-10 pt-12 mt-4 text-center group hover:bg-[#111] transition-colors">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#0c0c0c] border border-white/5 rounded-md flex items-center justify-center">
              <Code className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[13px] text-neutral-400 leading-relaxed font-medium">
              Integrate validation seamlessly using the official SDK.{" "}
              <span className="text-emerald-400">Enforce decisions inline</span>{" "}
              inside your application flow.
            </p>
          </div>

          {/* Card 2 */}
          <div className="relative w-full md:w-[320px] bg-[#0c0c0c] border border-white/5 rounded-xl p-10 pt-12 mt-4 text-center group hover:bg-[#111] transition-colors">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#0c0c0c] border border-white/5 rounded-md flex items-center justify-center">
              <Zap className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-[13px] text-neutral-400 leading-relaxed font-medium">
              Edge-network verification to{" "}
              <span className="text-sky-400">
                prevent cost explosions and bot attacks
              </span>{" "}
              with automatic spam-iteration blocking.
            </p>
          </div>

          {/* Card 3 */}
          <div className="relative w-full md:w-[320px] bg-[#0c0c0c] border border-white/5 rounded-xl p-10 pt-12 mt-4 text-center group hover:bg-[#111] transition-colors">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#0c0c0c] border border-white/5 rounded-md flex items-center justify-center">
              <Search className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-[13px] text-neutral-400 leading-relaxed font-medium">
              Built-in{" "}
              <span className="text-indigo-400">real-time analytics</span> to
              monitor API health, track regional trends, and review raw logs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
