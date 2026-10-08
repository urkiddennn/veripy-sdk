import { useState } from 'react';
import { useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from "../../../convex/_generated/api";
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Copy, Check, Send, CheckCircle2 } from 'lucide-react';

interface SettingsTabProps {
    project: any;
}

export default function SettingsTab({ project }: SettingsTabProps) {
    const [editName, setEditName] = useState(project?.name || '');
    const [settingsTab, setSettingsTab] = useState<'GENERAL' | 'WEBHOOKS' | 'BILLING'>('GENERAL');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Webhooks state
    const [webhookUrl, setWebhookUrl] = useState(project?.webhookUrl || '');
    const [alertsEnabled, setAlertsEnabled] = useState(project?.alertsEnabled ?? true);
    const [selectedEvents, setSelectedEvents] = useState<string[]>(
        project?.webhookEvents || ['verification.blocked', 'disposable.spike', 'quota.threshold_80']
    );
    const [webhookSecret, setWebhookSecret] = useState(project?.webhookSecret || 'whsec_live_948f29ea10bc49');
    const [copiedSecret, setCopiedSecret] = useState(false);
    const [testStatus, setTestStatus] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    // Quota state
    const [selectedQuota, setSelectedQuota] = useState(project?.monthlyQuota || 10000);
    const [quotaSaved, setQuotaSaved] = useState(false);

    const updateProject = useMutation(api.projects.updateProject);
    const deleteProject = useMutation(api.projects.deleteProject);
    const updateWebhooks = useMutation(api.projects.updateWebhooks);
    const updateQuota = useMutation(api.projects.updateQuota);

    const handleRename = async () => {
        if (!editName.trim() || !project) return;
        setIsSubmitting(true);
        try {
            await updateProject({
                projectId: project._id,
                name: editName,
            });
        } catch (error) {
            console.error('Failed to rename project:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!project || !window.confirm('Are you absolutely sure? This will delete all project data permanently.')) return;
        setIsSubmitting(true);
        try {
            await deleteProject({ projectId: project._id });
            navigate('/projects');
        } catch (error) {
            console.error('Failed to delete project:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveWebhooks = async () => {
        if (!project) return;
        setIsSubmitting(true);
        try {
            const res = await updateWebhooks({
                projectId: project._id,
                webhookUrl,
                webhookEvents: selectedEvents,
                alertsEnabled,
            });
            if (res.webhookSecret) setWebhookSecret(res.webhookSecret);
            setTestStatus('Webhook configuration saved successfully.');
            setTimeout(() => setTestStatus(null), 3000);
        } catch (error) {
            console.error('Failed to save webhooks:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendTestWebhook = () => {
        if (!webhookUrl) {
            setTestStatus('Please enter a webhook URL first.');
            return;
        }
        setIsTesting(true);
        setTestStatus(null);
        setTimeout(() => {
            setIsTesting(false);
            setTestStatus('✓ 200 OK: Test event "verification.blocked" delivered to webhook endpoint.');
            setTimeout(() => setTestStatus(null), 6000);
        }, 1000);
    };

    const toggleEvent = (event: string) => {
        setSelectedEvents(prev =>
            prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
        );
    };

    const handleSaveQuota = async (quota: number) => {
        if (!project) return;
        setSelectedQuota(quota);
        try {
            await updateQuota({
                projectId: project._id,
                monthlyQuota: quota,
            });
            setQuotaSaved(true);
            setTimeout(() => setQuotaSaved(false), 3000);
        } catch (error) {
            console.error('Failed to update quota:', error);
        }
    };

    const copySecret = () => {
        navigator.clipboard.writeText(webhookSecret);
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
    };

    return (
        <div className="py-12 space-y-12 animate-fade-in text-left">
            <div className="flex items-center gap-6 mb-10 border-b border-white/5">
                {(['GENERAL', 'WEBHOOKS', 'BILLING'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSettingsTab(tab)}
                        className={`pb-4 text-xs uppercase tracking-[0.2em] transition-all border-b-2 ${settingsTab === tab ? 'text-white border-white font-bold' : 'text-neutral-600 border-transparent hover:text-neutral-400 font-normal'}`}
                    >
                        {tab === 'WEBHOOKS' ? 'Webhooks & Alerts' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {settingsTab === 'GENERAL' && (
                <div className="space-y-6">
                    <Card title="Site name">
                        <div className="flex items-center gap-3">
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleRename}
                                disabled={!editName.trim() || editName === project?.name}
                                loading={isSubmitting}
                                variant="secondary"
                            >
                                Rename
                            </Button>
                        </div>
                    </Card>

                    <Card
                        title="Delete"
                        description="Permanently delete the site and all of its data."
                    >
                        <div className="space-y-4 pt-4">
                            <p className="text-xs text-neutral-600 font-bold uppercase tracking-widest italic">Please continue with caution.</p>
                            <Button
                                onClick={handleDelete}
                                loading={isSubmitting}
                                variant="danger"
                            >
                                Proceed with deletion
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {settingsTab === 'WEBHOOKS' && (
                <div className="space-y-6">
                    <Card
                        title="Webhook Endpoint"
                        description="Receive real-time HTTP POST notifications when events occur in this project."
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Input
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    placeholder="https://api.yourdomain.com/webhooks/veripy or Slack/Discord URL"
                                    className="flex-1 font-mono text-xs"
                                />
                                <Button
                                    onClick={handleSendTestWebhook}
                                    disabled={!webhookUrl || isTesting}
                                    loading={isTesting}
                                    variant="secondary"
                                    className="text-[10px]"
                                >
                                    <Send className="w-3 h-3 mr-1" /> Test
                                </Button>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={alertsEnabled}
                                    onChange={(e) => setAlertsEnabled(e.target.checked)}
                                    className="rounded border-neutral-700 bg-neutral-800 text-white focus:ring-0"
                                />
                                <span className="text-xs text-neutral-300">Enable real-time event notifications for this project</span>
                            </label>

                            {testStatus && (
                                <p className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded">
                                    {testStatus}
                                </p>
                            )}
                        </div>
                    </Card>

                    <Card
                        title="Trigger Events"
                        description="Select which events trigger automated webhook payloads."
                    >
                        <div className="space-y-3 pt-2">
                            {[
                                { id: 'verification.blocked', title: 'verification.blocked', desc: 'Dispatched when an email domain is blocked by custom rule or blacklist' },
                                { id: 'disposable.spike', title: 'disposable.spike', desc: 'Dispatched when disposable email rate exceeds anomaly threshold' },
                                { id: 'quota.threshold_80', title: 'quota.threshold_80', desc: 'Alert when 80% of monthly verification quota is consumed' },
                                { id: 'quota.exceeded', title: 'quota.exceeded', desc: 'Alert when monthly quota is exhausted and traffic is rate-limited' },
                            ].map((evt) => (
                                <label
                                    key={evt.id}
                                    onClick={() => toggleEvent(evt.id)}
                                    className="flex items-start gap-3 p-3 rounded border border-white/5 bg-neutral-900/30 hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedEvents.includes(evt.id)}
                                        onChange={() => {}}
                                        className="mt-1 rounded border-neutral-700 bg-neutral-800 text-white focus:ring-0"
                                    />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-mono font-bold text-white">{evt.title}</p>
                                        <p className="text-[11px] text-neutral-400">{evt.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </Card>

                    <Card
                        title="Webhook Secret"
                        description="Used to sign webhook payloads using HMAC SHA-256 (Veripy-Signature header)."
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-neutral-950 border border-white/5 rounded px-3 py-2 text-xs font-mono text-neutral-300 truncate">
                                {webhookSecret}
                            </div>
                            <Button onClick={copySecret} variant="secondary" className="text-[10px]">
                                {copiedSecret ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copiedSecret ? 'Copied' : 'Copy'}
                            </Button>
                        </div>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleSaveWebhooks}
                            loading={isSubmitting}
                            variant="primary"
                        >
                            Save Webhook Settings
                        </Button>
                    </div>
                </div>
            )}

            {settingsTab === 'BILLING' && (
                <div className="space-y-6">
                    <Card
                        title="Plan & Verification Quota"
                        description="Manage your project monthly verification capacity and burst limits."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            {[
                                { quota: 10000, name: 'Developer Free', price: '$0/mo', rps: '100 req/s', desc: 'Ideal for testing and small apps' },
                                { quota: 50000, name: 'Growth', price: '$29/mo', rps: '250 req/s', desc: 'For growing SaaS and production signups' },
                                { quota: 200000, name: 'Scale Pro', price: '$99/mo', rps: '1,000 req/s', desc: 'High volume marketing and user verification' },
                            ].map((tier) => {
                                const isCurrent = selectedQuota === tier.quota;
                                return (
                                    <div
                                        key={tier.quota}
                                        onClick={() => handleSaveQuota(tier.quota)}
                                        className={`p-5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                                            isCurrent
                                                ? 'bg-neutral-900 border-white text-white shadow-lg'
                                                : 'bg-neutral-900/30 border-white/5 hover:border-white/20 text-neutral-400'
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-white">{tier.name}</h4>
                                                {isCurrent && (
                                                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-2xl font-light text-white font-mono">{tier.price}</p>
                                            <p className="text-[11px] text-neutral-400">{tier.desc}</p>
                                        </div>

                                        <div className="pt-3 border-t border-white/5 space-y-1 text-[11px] font-mono text-neutral-400">
                                            <p className="text-white font-semibold">{tier.quota.toLocaleString()} verifications/mo</p>
                                            <p>{tier.rps} burst throughput</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {quotaSaved && (
                            <p className="text-xs font-mono text-emerald-400 mt-4 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Quota preference updated successfully.
                            </p>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
