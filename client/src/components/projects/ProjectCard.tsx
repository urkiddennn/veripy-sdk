import { useNavigate } from "react-router-dom";
import { Globe, ChevronRight, Clock, MoreHorizontal } from "lucide-react";

interface ProjectCardProps {
  project: any;
  onSettingsClick: (e: React.MouseEvent, project: any) => void;
}

export default function ProjectCard({
  project,
  onSettingsClick,
}: ProjectCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/dashboard/${project._id}`)}
      className="group relative flex items-center justify-between p-3 hover:bg-neutral-900/40 transition-all cursor-pointer rounded-md"
    >
      <div className="flex items-center gap-6">
        <div className="w-8 h-8 bg-neutral-900/50 rounded-md flex items-center justify-center group-hover:bg-neutral-800 transition-all shadow-sm">
          <Globe
            className="w-3 h-3 text-neutral-500 group-hover:text-white transition-all"
            strokeWidth={1.5}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-wide text-neutral-300 group-hover:text-white transition-all">
              {project.name}
            </h3>
            <ChevronRight className="w-3 h-3 text-neutral-700 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-neutral-600 font-normal  tracking-widest">
              {project.slug}.veripy.io
            </p>
            <div className="w-1 h-1 rounded-full bg-neutral-900" />
            <div className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-neutral-700" />
              <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">
                No requests recently
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 bg-neutral-900 rounded-md text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">
          Free
        </div>
        <button
          onClick={(e) => onSettingsClick(e, project)}
          className="p-1.5 rounded-md hover:bg-white/5 text-neutral-800 group-hover:text-neutral-400 transition-colors focus:outline-none"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
