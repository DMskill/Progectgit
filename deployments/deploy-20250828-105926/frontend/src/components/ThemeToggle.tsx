'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const [dark, setDark] = useState(false);

    const applyTheme = (isDark: boolean) => {
        setDark(isDark);
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
        }
        try {
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        } catch { }
    };

    useEffect(() => {
        try {
            const stored = localStorage.getItem('theme');
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initial = stored ? stored === 'dark' : prefersDark;
            applyTheme(initial);
        } catch {
            applyTheme(false);
        }
    }, []);

    return (
        <button onClick={() => applyTheme(!dark)} className="h-8 w-8 rounded border inline-flex items-center justify-center icon-hover" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
            {dark ? (
                // Sun
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                    <g stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2v3" /><path d="M12 19v3" />
                        <path d="M4.22 4.22l2.12 2.12" /><path d="M17.66 17.66l2.12 2.12" />
                        <path d="M2 12h3" /><path d="M19 12h3" />
                        <path d="M4.22 19.78l2.12-2.12" /><path d="M17.66 6.34l2.12-2.12" />
                    </g>
                </svg>
            ) : (
                // Moon
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" />
                </svg>
            )}
        </button>
    );
} 