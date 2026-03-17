import { Link } from "react-router-dom";

export default function LandingNavbar() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md flex items-center justify-center">
            <img src="/veripy.svg" alt="Veripy Logo" className="w-6 h-6" />
          </div>
          <span className="text-md font-bold tracking-tight">Veripy</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <Link to="/docs" className="hover:text-foreground transition-colors">
            Documentation
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
