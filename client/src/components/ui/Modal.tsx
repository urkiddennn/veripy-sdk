import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    maxWidth?: 'md' | 'lg' | '2xl' | '4xl';
}

export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    maxWidth = 'md'
}: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const maxWidths = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className={`relative w-full ${maxWidths[maxWidth]} bg-black rounded-md shadow-2xl p-8 animate-in fade-in zoom-in duration-200 border border-white/5`}>
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-white tracking-tight uppercase">{title}</h2>
                        {subtitle && (
                            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-all text-neutral-500"
                    >
                        <Plus className="w-4 h-4 rotate-45" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
