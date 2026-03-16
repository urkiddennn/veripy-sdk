import { useState } from "react";
import { Plus, Loader2, Search, Settings } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// Refactored Components
import Navbar from "../components/layout/Navbar";
import ProjectCard from "../components/projects/ProjectCard";
import CreateProjectModal from "../components/projects/CreateProjectModal";
import ProjectSettingsModal from "../components/projects/ProjectSettingsModal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Projects() {
  const userId = localStorage.getItem("veripy_user_id") as Id<"users"> | null;
  const user = useQuery(api.users.getUser, { userId: userId ?? undefined });
  const projects = useQuery(api.projects.getProjects, {
    userId: userId ?? undefined,
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const openSettings = (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    setSelectedProject(project);
    setIsSettingsModalOpen(true);
  };

  const filteredProjects = projects?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (userId && (user === undefined || projects === undefined)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground text-xs font-bold uppercase tracking-widest">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-500 mr-2" />
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-white/10 overflow-x-hidden">
      <Navbar user={user} />

      <main className="max-w-[900px] mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <h1 className="text-md font-bold tracking-tight text-white uppercase">
              {user?.name?.split(" ")[0] || "Personal"}
            </h1>
            <span className="px-2 py-0.5 bg-white/5 rounded-md text-xs font-normal text-neutral-500 uppercase tracking-widest">
              Owner
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className=""
              icon={<Plus className="w-3 h-3" strokeWidth={3} />}
            >
              New Project
            </Button>
            <button className="p-2 hover:bg-white/5 rounded-md transition-all text-neutral-500">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-10 text-left">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              icon={<Search className="w-3.5 h-3.5" />}
            />
          </div>
        </div>

        {/* Project List */}
        <div className="space-y-px rounded-md overflow-hidden">
          {filteredProjects?.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onSettingsClick={openSettings}
            />
          ))}

          {filteredProjects?.length === 0 && searchQuery && (
            <div className="py-20 flex flex-col items-center justify-center bg-black">
              <div className="w-10 h-10 bg-neutral-900 rounded-md flex items-center justify-center mb-4 border border-white/5">
                <Search className="w-4 h-4 text-neutral-700" />
              </div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                No projects found
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-xs font-thin text-neutral-400 hover:text-white uppercase tracking-widest underline underline-offset-4"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {userId && (
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          userId={userId}
        />
      )}

      {isSettingsModalOpen && selectedProject && (
        <ProjectSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          project={selectedProject}
        />
      )}
    </div>
  );
}
