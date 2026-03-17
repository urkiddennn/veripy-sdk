import { useState } from "react";
import { Mail, Lock, Github, ArrowRight, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const createUser = useMutation(api.users.createUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const userId = await createUser({
        name: fullName,
        email: email,
        password: password,
      });
      localStorage.setItem("veripy_user_id", userId);
      navigate("/projects");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
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
            Create an account
          </h1>
          <p className="text-neutral-400 text-sm font-medium">
            Join Veripy and start verifying with confidence
          </p>
        </div>

        {/* Social Auth */}
        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="secondary"
            className="w-full h-12"
            icon={<Github className="w-5 h-5" />}
          >
            Continue with GitHub
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
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

          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            label="Full Name"
            icon={<User className="w-4 h-4" />}
          />

          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Email address"
            icon={<Mail className="w-4 h-4" />}
          />

          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            icon={<Lock className="w-4 h-4" />}
          />

          <div className="pt-2">
            <Button
              type="submit"
              loading={isLoading}
              className="w-full h-12"
              size="lg"
            >
              Create Account{" "}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </form>

        <p className="text-center text-sm font-medium text-neutral-500">
          Already have an account?{" "}
          <Link to="/login" className="text-white font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
