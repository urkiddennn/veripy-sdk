import { useState } from "react";
import { Mail, Lock, Github, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const loginUser = useMutation(api.users.loginUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const userId = await loginUser({
        email: email,
        password: password,
      });
      localStorage.setItem("veripy_user_id", userId);
      navigate("/projects");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 layout-grid">
      <div className="w-full max-w-100 space-y-8 animate-fade-in-up relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
            <img src="/veripy.svg" alt="Veripy Logo" className="w-6 h-6" />
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="text-neutral-400 text-sm font-medium">
            Enter your credentials to access your dashboard
          </p>
        </div>

        {/* Social Auth */}
        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="secondary"
            className="w-full h-12 font-semibold text-xs"
            icon={<Github className="w-5 h-5" />}
          >
            Continue with GitHub
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs font-thin uppercase tracking-widest">
            <span className="bg-black px-4 text-neutral-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-red-400 bg-red-400/10 border border-red-500/20 rounded-md animate-shake">
              {error}
            </div>
          )}

          <label
            className="text-xs font-normal text-neutral-500 uppercase tracking-[0.2em] ml-1"
            htmlFor="email"
          >
            Email
          </label>

          <Input
            id="email"
            type="email"
            required
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <label
                className="text-xs font-normal text-neutral-500 uppercase tracking-[0.2em] ml-1"
                htmlFor="password"
              >
                Password
              </label>
              <a
                href="#"
                className="text-[10px] text-white hover:text-neutral-300 transition-colors font-bold uppercase tracking-widest"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              loading={isLoading}
              className="w-full h-12"
              size="lg"
            >
              Sign In {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </form>

        <p className="text-center text-sm font-thin text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-white font-bold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
