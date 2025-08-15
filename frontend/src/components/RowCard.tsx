'use client';

import React from 'react';

type RowCardProps = {
    children: React.ReactNode;
    zebraIndex: number;
    className?: string;
    delayMs?: number;
};

export default function RowCard({ children, zebraIndex, className = '', delayMs = 0 }: RowCardProps) {
    return (
        <div
            className={[
                'flex flex-wrap md:flex-nowrap items-start px-2 md:px-2',
                zebraIndex % 2 === 0 ? 'md:bg-white md:dark:bg-black' : 'md:bg-gray-50 md:dark:bg-gray-950',
                'bg-[rgba(255,255,255,0.03)] dark:bg-[rgba(17,24,39,0.55)]',
                'border border-transparent md:border-t md:border-x-0 md:border-b-0 md:border-gray-200 md:dark:border-gray-800 first:md:border-t-0',
                'rounded-lg md:rounded-none my-2 md:my-0 transition shadow-none hover:border-cyan-300/40 md:hover:shadow-[0_8px_30px_rgba(34,211,238,0.25)] md:hover:bg-gray-50 md:dark:hover:bg-gray-900/60',
                'focus-within:ring-1 focus-within:ring-cyan-300/40 focus-within:outline-none',
                'appear',
                className,
            ].join(' ')}
            style={{ animationDelay: delayMs ? `${delayMs}ms` : undefined }}
        >
            {children}
        </div>
    );
} 