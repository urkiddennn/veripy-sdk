import { Github } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import Button from "../components/ui/Button";

export default function Signup() {
  const { signIn } = useAuthActions();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 layout-grid">
      <div className="w-full max-w-100 space-y-8 animate-fade-in-up relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
            <img src="/veripy.svg" alt="Veripy Logo" className="w-6 h-6" />
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create an account
          </h1>
          <p className="text-neutral-400 text-sm font-medium">
            Join Veripy using your GitHub account
          </p>
        </div>

        {/* Social Auth */}
        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="secondary"
            className="w-full h-12 font-semibold text-xs"
            icon={<Github className="w-5 h-5" />}
            onClick={() => void signIn("github", { redirectTo: "/projects" })}
          >
            Continue with GitHub
          </Button>
        </div>

        <p className="text-center text-sm font-thin text-neutral-500">
          Already have an account?{" "}
          <Link to="/login" className="text-white font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
