import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Plus, Trash2, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

export default function DomainRulesTab({ projectId }: { projectId?: Id<"projects"> }) {
  const rules = useQuery(api.domainRules.listRules, projectId ? { projectId } : "skip");
  const addRule = useMutation(api.domainRules.addRule);
  const removeRule = useMutation(api.domainRules.removeRule);

  const [domain, setDomain] = useState("");
  const [action, setAction] = useState<"allow" | "block">("allow");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim() || !projectId) return;

    // basic domain validation
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
      setError("Please enter a valid domain (e.g., example.com)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await addRule({
        projectId,
        domain: domain.toLowerCase().trim(),
        action,
      });

      if (result.alreadyExists) {
        setError(`A rule for ${domain} already exists.`);
      } else {
        setDomain("");
      }
    } catch (err: any) {
      setError("Failed to add domain rule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allowCount = rules?.filter(r => r.action === "allow").length || 0;
  const blockCount = rules?.filter(r => r.action === "block").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded bg-neutral-900 border border-white/10 flex items-center justify-center">
          <ShieldAlert className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Domain Rules</h2>
          <p className="text-xs text-neutral-500 mt-1">Manage custom allow and block lists for this project</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border border-white/5 bg-neutral-900/50 rounded-lg">
          <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500/70" /> Allowlist
          </div>
          <div className="text-2xl text-white font-mono">{rules === undefined ? "-" : allowCount}</div>
        </div>
        <div className="p-4 border border-white/5 bg-neutral-900/50 rounded-lg">
          <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500/70" /> Blocklist
          </div>
          <div className="text-2xl text-white font-mono">{rules === undefined ? "-" : blockCount}</div>
        </div>
      </div>

      {/* Add Rule Form */}
      <div className="p-6 border border-white/5 bg-neutral-900/30 rounded-lg space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-300">Add New Rule</h3>
        <form onSubmit={handleAddRule} className="flex gap-4 items-start">
          <div className="flex-1 space-y-1">
            <input
              type="text"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setError(null);
              }}
              placeholder="e.g. example.com"
              className="w-full bg-neutral-950 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-neutral-700 outline-none focus:border-white/30 transition-colors"
              disabled={isSubmitting}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <select
            value={action}
            onChange={(e) => setAction(e.target.value as "allow" | "block")}
            className="bg-neutral-950 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors"
            disabled={isSubmitting}
          >
            <option value="allow">Allow</option>
            <option value="block">Block</option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting || !domain.trim()}
            className="bg-white text-black px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </form>
      </div>

      {/* Rules List */}
      <div className="border border-white/5 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-neutral-900/50">
              <th className="p-4 text-xs font-bold tracking-widest uppercase text-neutral-500">Domain</th>
              <th className="p-4 text-xs font-bold tracking-widest uppercase text-neutral-500">Action</th>
              <th className="p-4 text-xs font-bold tracking-widest uppercase text-neutral-500 w-24">Date</th>
              <th className="p-4 text-right w-16"></th>
            </tr>
          </thead>
          <tbody>
            {rules === undefined ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-neutral-500 text-sm">Loading...</td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-500 text-sm">
                  No domain rules configured yet.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule._id} className="border-b border-white/5 bg-neutral-950/20 hover:bg-neutral-900/40 transition-colors">
                  <td className="p-4 text-neutral-200 font-mono text-xs">{rule.domain}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                      rule.action === "allow" 
                        ? "bg-emerald-500/10 text-emerald-500" 
                        : "bg-red-500/10 text-red-500"
                    }`}>
                      {rule.action === "allow" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {rule.action}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-neutral-500">
                    {new Date(rule.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => removeRule({ id: rule._id })}
                      className="text-neutral-600 hover:text-red-500 transition-colors p-1"
                      title="Remove rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
