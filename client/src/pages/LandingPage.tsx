import { useState } from "react";
import { ArrowRight, ChevronDown, CheckCircle2, Copy } from "lucide-react";
import LandingNavbar from "../components/layout/LandingNavbar";
import FeatureSection from "../components/ui/FeatureSection";
import Pricing from "../components/ui/Pricing";
import { useNavigate } from "react-router-dom";
import Footer from "../components/ui/Footer";
import IconIntegration from "../components/ui/IconsIntegration";

export default function LandingPage() {
  const [activeAccordion, setActiveAccordion] = useState<number>(0);
  const navigate = useNavigate();

  const accordionFeatures = [
    {
      title: "Disposable Email Detection",
      content:
        "Instantly block signups from temporary email services to ensure high-quality leads and accurate analytics.",
    },
    {
      title: "Syntax & Typo Checking",
      content:
        "Catch common typos (like @gmial.com) before they bounce, and prompt users to correct their input in real-time.",
    },
    {
      title: "Role-Based Address Filtering",
      content:
        "Prevent signups from generic role addresses like support@, admin@, or info@ to maintain a list of actual humans.",
    },
    {
      title: "Built-in Rate Limiting",
      content: "Prevent multiple sigup and signin",
    },
  ];
  // handle go to docs page
  const handleDocs = () => {
    navigate("/docs");
  };
  // handle go to signup
  const handleGoToSignup = () => {
    navigate("/signup");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-[128px]" />
        </div>

        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm font-semibold text-primary mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            New: Verification Engine v2
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.1]">
            Trust, but{" "}
            <span className=" italic text-blue-500 font-bold">Verify</span>.
          </h1>
          <p className="text-lg md:text-lg font-thin text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Veripy is the fast, high-performance API to protect your application
            from fake accounts and malicious bots.
          </p>
          <div className="w-full flex justify-center mb-5">
            <div className="px-5 py-2 rounded-full bg-gray-950 flex justify-center items-center max-w-xs mx-auto w-full gap-3">
              <Copy size={15} /> <p>npm install veripy-sdk</p>
            </div>
          </div>
          {/* Icons Integration*/}
          <IconIntegration />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              className="text-sm w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
              onClick={handleGoToSignup}
            >
              Start Building Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              className=" text-sm  w-full sm:w-auto px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-full border border-border hover:bg-border/50 transition-all"
              onClick={handleDocs}
            >
              View Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeatureSection />

      {/* Interactive Feature Accordion Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left: Visual / Image */}
            <div className="relative aspect-square md:aspect-auto md:h-[500px] w-full bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden group">
              {/* Abstract visualization */}
              <div className="absolute inset-0 bg-linear-to-tr from-primary/20 via-transparent to-accent/20 opacity-50 transition-opacity duration-700 group-hover:opacity-100" />
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="w-full max-w-sm space-y-4">
                  {[1, 2, 3].map((_, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border border-white/10 bg-black flex items-center gap-4 shadow-2xl transition-all duration-500 hover:scale-[1.02] ${i === 1 ? "ml-8" : ""}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="h-2 w-24 bg-white/20 rounded-full" />
                        <div className="h-2 w-16 bg-white/10 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Accordion */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  The ultimate verification engine
                </h2>
                <p className="text-muted-foreground text-md leading-relaxed font-normal">
                  Our multi-layered approach ensures that only clean,
                  deliverable addresses make it to your database.
                </p>
              </div>

              <div className="space-y-4">
                {accordionFeatures.map((feature, index) => {
                  const isActive = activeAccordion === index;
                  return (
                    <div
                      key={index}
                      className={`rounded-xl transition-all duration-300 overflow-hidden ${
                        isActive
                          ? "bg-secondary/50 border-white/20"
                          : "bg-transparent border-transparent hover:border-white/5"
                      }`}
                    >
                      <button
                        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                        onClick={() =>
                          setActiveAccordion(isActive ? -1 : index)
                        }
                      >
                        <span
                          className={`text-md font-semibold transition-colors ${isActive ? "text-white" : "text-neutral-400"}`}
                        >
                          {feature.title}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 transition-transform duration-300 ${isActive ? "rotate-180 text-white" : "text-neutral-500"}`}
                        />
                      </button>
                      <div
                        className={`px-6 transition-all duration-300 ease-in-out ${
                          isActive
                            ? "max-h-[200px] pb-6 opacity-100"
                            : "max-h-0 pb-0 opacity-0"
                        }`}
                      >
                        <p className="text-muted-foreground leading-relaxed font-thin text-sm">
                          {feature.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <Pricing />

      {/* Footer */}
      <Footer />
    </div>
  );
}
