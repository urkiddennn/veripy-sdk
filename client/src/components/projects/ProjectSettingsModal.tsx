import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../../convex/_generated/api";
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface ProjectSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
}

export default function ProjectSettingsModal({ isOpen, onClose, project }: ProjectSettingsModalProps) {
    const [editName, setEditName] = useState(project?.name || '');
    const [settingsTab, setSettingsTab] = useState<'GENERAL' | 'BILLING'>('GENERAL');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateProject = useMutation(api.projects.updateProject);
    const deleteProject = useMutation(api.projects.deleteProject);

    const handleRename = async () => {
        if (!editName.trim() || !project) return;
        setIsSubmitting(true);
        try {
            await updateProject({
                projectId: project._id,
                name: editName,
            });
            onClose();
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
            onClose();
        } catch (error) {
            console.error('Failed to delete project:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Site Settings"
            maxWidth="2xl"
        >
            <div className="flex items-center gap-6 mb-10 border-b border-white/5">
                <button
                    onClick={() => setSettingsTab('GENERAL')}
                    className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${settingsTab === 'GENERAL' ? 'text-white border-white' : 'text-neutral-600 border-transparent hover:text-neutral-400'}`}
                >
                    General
                </button>
                <button
                    onClick={() => setSettingsTab('BILLING')}
                    className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${settingsTab === 'BILLING' ? 'text-white border-white' : 'text-neutral-600 border-transparent hover:text-neutral-400'}`}
                >
                    Billing
                </button>
            </div>

            {settingsTab === 'GENERAL' ? (
                <div className="space-y-6 text-left">
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
                            <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest italic">Please continue with caution.</p>
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
            ) : (
                <div className="py-20 flex flex-col items-center justify-center bg-neutral-900/20 rounded-md border border-dashed border-white/5">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Billing controls coming soon</p>
                </div>
            )}
        </Modal>
    );
}
