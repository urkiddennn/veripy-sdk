import type React from "react";
import { Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
const Pricing: React.FC = () => {
  const navigate = useNavigate();

  const handleSignup = () => {
    navigate("/signup");
  };
  return (
    <section id="pricing" className="py-24 border-t border-white/5">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-muted-foreground mb-16 font-thin">
          Start for free, scale as you grow.
        </p>
        <div className="max-w-md mx-auto p-8 bg-neutral-900/50 border border-primary/20 rounded-md relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 px-4 py-1 bg-primary text-[10px] font-bold text-primary-foreground uppercase tracking-widest rounded-bl-xl leading-relaxed">
            Most Popular
          </div>
          <h3 className="text-xl font-bold mb-2">Developer</h3>
          <div className="flex items-baseline justify-center gap-1 mb-6">
            <span className="text-4xl font-bold">$0</span>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>
          <ul className="space-y-4 text-sm text-neutral-400 mb-8 text-left">
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              1,000 requests / month
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Standard API Access
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Community Support
            </li>
          </ul>
          <button
            className="w-full py-3 bg-white text-black font-bold rounded-md hover:bg-neutral-200 transition-colors"
            onClick={handleSignup}
          >
            Get Started Free
          </button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
