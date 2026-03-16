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
    userId: Id<"users">;
}

export default function CreateProjectModal({ isOpen, onClose, userId }: CreateProjectModalProps) {
    const navigate = useNavigate();
    const createProject = useMutation(api.projects.createProject);
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            const projectId = await createProject({
                name,
                userId,
            });
            onClose();
            setName('');
            navigate(`/dashboard/${projectId}`);
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create new project"
            subtitle="A space for your API keys and analytics"
        >
            <form onSubmit={handleCreate} className="space-y-6">
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
