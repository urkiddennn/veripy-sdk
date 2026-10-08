import { useState } from 'react';
import { useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: Id<"users">;
}

export default function CreateProjectModal({ isOpen, onClose, userId }: CreateProjectModalProps) {
    const navigate = useNavigate();
    const createProject = useMutation(api.projects.createProject);
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setError(null);
        setIsSubmitting(true);
        try {
            const projectId = await createProject({
                name: name.trim(),
                ...(userId ? { userId } : {}),
            });
            onClose();
            setName('');
            setError(null);
            navigate(`/dashboard/${projectId}`);
        } catch (err: any) {
            console.error('Failed to create project:', err);
            setError(err?.message || 'Failed to create project. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setError(null);
                onClose();
            }}
            title="Create new project"
            subtitle="A space for your API keys and analytics"
        >
            <form onSubmit={handleCreate} className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-xs">
                        {error}
                    </div>
                )}
                <Input
                    autoFocus
                    label="Project Name"
                    placeholder="MY AWESOME PROJECT"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <div className="flex items-center gap-3 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={!name.trim()}
                        loading={isSubmitting}
                        className="flex-1"
                    >
                        Create Project
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
