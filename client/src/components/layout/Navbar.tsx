import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  MessageSquare,
  LogOut,
  User,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

interface NavbarProps {
  user?: any;
  workspaceName?: string;
}

export default function Navbar({
  user,
}: NavbarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem("veripy_user_id");
    navigate("/login");
  };

  return (
    <nav className="h-14 border-b border-white/10 px-6 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-50">
      <div className="max-w-6xl flex items-center justify-between mx-auto w-full">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => navigate("/projects")}
          >
            <img src="/veripy.svg" alt="Veripy Logo" className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate("/docs")}
              className="text-xs font-thin uppercase tracking-widest text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5 focus:outline-none"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Docs</span>
            </button>
            <button className="text-xs font-thin uppercase tracking-widest text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5 focus:outline-none">
              <MessageSquare className="w-4 h-4" />
              <span>Support</span>
            </button>
          </div>

          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center border border-white/10 hover:border-white/20 transition-all cursor-pointer overflow-hidden shadow-inner"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user?.name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-xs font-bold">
                  {user?.name?.charAt(0) || <User className="w-3.5 h-3.5 text-neutral-400" />}
                </div>
              )}
            </div>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-neutral-900 border border-white/10 rounded-md shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-white/5 mb-1">
                  <p className="text-xs font-bold text-white tracking-tight truncate">
                    {user?.name || "Account"}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {user?.email || "No email available"}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/5 transition-colors uppercase tracking-widest text-left"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
