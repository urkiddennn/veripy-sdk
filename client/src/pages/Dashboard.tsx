import { useState } from "react";
import { Loader2, Hexagon, Clock, Settings } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import RequestsTab from "../components/dashboard/RequestsTab";
import APIKeysTab from "../components/dashboard/APIKeysTab";
import OverviewTab from "../components/dashboard/OverviewTab";
import SettingsTab from "../components/dashboard/SettingsTab";

import Navbar from "../components/layout/Navbar";

type ProjectTab = "requests" | "analytics" | "sdk-config" | "settings";

export default function Dashboard() {
  const { projectId } = useParams<{ projectId: Id<"projects"> }>();
  const [activeTab, setActiveTab] = useState<ProjectTab>("requests");
  const navigate = useNavigate();
  const userId = localStorage.getItem("veripy_user_id") as Id<"users"> | null;
  const user = useQuery(api.users.getUser, { userId: userId ?? undefined });
  const project = useQuery(api.projects.getProject, { projectId });

  if ((userId && user === undefined) || (projectId && project === undefined)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground text-xs font-bold uppercase tracking-widest">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-500 mr-2" />
        Loading...
      </div>
    );
  }

  if (projectId && project === null) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
          Project not found
        </p>
        <button
          onClick={() => navigate("/projects")}
          className="px-4 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded hover:bg-neutral-200 transition-all"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-neutral-200 font-sans selection:bg-white/10 overflow-x-hidden">
      <Navbar
        user={user}
        workspaceName={project?.name}
      />

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Project Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-neutral-900 border border-white/5 rounded-md flex items-center justify-center shadow-inner">
              <Hexagon className="w-4 h-4 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-white">
                {project?.name ?? "Default Project"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-neutral-600 font-bold uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              <span>Free Plan</span>
            </div>
            <button
              onClick={() => setActiveTab("settings")}
              className={`p-2 hover:bg-neutral-900 rounded-md transition-all border border-transparent ${activeTab === "settings" ? "bg-neutral-900 border-white/10" : "hover:border-white/5"}`}
            >
              <Settings
                className={`w-4 h-4 transition-colors ${activeTab === "settings" ? "text-white" : "text-neutral-500"}`}
              />
            </button>
          </div>
        </div>

        {/* Project Sub-navigation */}
        <div className="flex items-center gap-6 border-b border-white/5">
          {(["requests", "analytics", "sdk-config"] as ProjectTab[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-xs tracking-[0.15em] uppercase transition-all relative ${activeTab === tab
                    ? "text-white font-bold"
                    : "text-neutral-500 hover:text-neutral-300 font-normal"
                  }`}
              >
                {tab === "sdk-config" ? "SDK CONFIG" : tab.replace("-", " ")}
                {activeTab === tab && (
                  <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
            ),
          )}
        </div>

        {/* Content Area */}
        <div className="animate-fade-in">
          {activeTab === "requests" && <RequestsTab projectId={projectId} />}
          {activeTab === "analytics" && <OverviewTab projectId={projectId} />}
          {activeTab === "sdk-config" && <APIKeysTab projectId={projectId} />}
          {activeTab === "settings" && <SettingsTab project={project} />}
        </div>
      </main>
    </div>
  );
}
