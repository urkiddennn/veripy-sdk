import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
}

export default function Input({ label, icon, className = '', ...props }: InputProps) {
    return (
        <div className="space-y-2 w-full">
            {label && (
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] ml-1">
                    {label}
                </label>
            )}
            <div className="relative group w-full">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-white transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    className={`w-full bg-black border border-white/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:border-white/20 transition-colors placeholder:text-neutral-800 text-white ${icon ? 'pl-10' : ''
                        } ${className}`}
                    {...props}
                />
            </div>
        </div>
    );
}
