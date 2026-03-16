import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const variants = {
        primary: 'bg-white text-black hover:bg-neutral-200 shadow-lg hover:shadow-white/5',
        secondary: 'bg-neutral-900 text-neutral-300 border border-white/10 hover:bg-neutral-800 hover:text-white hover:border-white/20',
        ghost: 'text-neutral-500 hover:text-white transition-colors hover:bg-white/5',
        danger: 'bg-red-500/80 text-white hover:bg-red-500 shadow-lg shadow-red-500/10',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-6 py-2.5 text-xs',
        lg: 'px-8 py-3 text-sm',
    };

    const baseStyles = 'inline-flex items-center justify-center gap-2 font-bold uppercase tracking-widest rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed';

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {!loading && icon}
            {children}
        </button>
    );
}
