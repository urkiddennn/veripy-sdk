import type React from "react";
import { Shield, Zap } from "lucide-react";
const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-12 border-t border-border">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Shield className="text-primary w-6 h-6" />
          <span className="font-bold">Veripy</span>
        </div>
        <p className="text-sm font-thin text-muted-foreground">
          © 2026 Veripy Inc. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Zap className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
