"use client";

import { useMemo, useState, useRef, useEffect } from 'react';
import { COUNTRIES, Country } from '@/lib/countries';
import { useLocale } from 'next-intl';

export default function CountrySelect({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (name: string, code?: string) => void;
    placeholder: string;
}) {
    const locale = useLocale();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onDocMouseDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDocMouseDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown);
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    const prepared = useMemo(() => {
        // unique by code to avoid duplicates
        const unique = new Map<string, Country>();
        for (const c of COUNTRIES) if (!unique.has(c.code)) unique.set(c.code, c);
        const dn = new Intl.DisplayNames([locale], { type: 'region' });
        const dnEn = new Intl.DisplayNames(['en'], { type: 'region' });
        const arr = Array.from(unique.values()).map((c) => ({
            code: c.code,
            label: (dn.of(c.code) as string) || c.name,
            alt: (dnEn.of(c.code) as string) || c.name,
        }));
        arr.sort((a, b) => a.label.localeCompare(b.label));
        return arr;
    }, [locale]);

    const list = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return prepared;
        return prepared.filter((c) =>
            c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q) || c.alt.toLowerCase().includes(q)
        );
    }, [prepared, query]);

    const pick = (c: { code: string; label: string }) => {
        onChange(c.label, c.code);
        setQuery('');
        setOpen(false);
    };

    return (
        <div className="relative" ref={rootRef}>
            <input
                value={value}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onChange(e.target.value, undefined);
                }}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                className="ux-input ux-select focus-ux w-full placeholder:opacity-60"
            />
            {open && (
                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto border rounded bg-white dark:bg-gray-900 text-sm">
                    {list.map((c) => (
                        <button
                            key={c.code}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pick(c)}
                            className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            {c.label} <span className="opacity-50 text-xs">({c.code})</span>
                        </button>
                    ))}
                    {list.length === 0 && (
                        <div className="px-2 py-2 opacity-60">Нет совпадений, можно ввести вручную</div>
                    )}
                </div>
            )}
        </div>
    );
} 