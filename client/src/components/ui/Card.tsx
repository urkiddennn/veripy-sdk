import React from 'react';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    className?: string;
}

export default function Card({ children, title, description, className = '' }: CardProps) {
    return (
        <div className={`bg-neutral-900/30 rounded-md p-8 border border-white/5 space-y-6 ${className}`}>
            {(title || description) && (
                <div className="space-y-2">
                    {title && <h3 className="text-sm font-bold text-white">{title}</h3>}
                    {description && <p className="text-xs text-neutral-500">{description}</p>}
                </div>
            )}
            <div>{children}</div>
        </div>
    );
}
