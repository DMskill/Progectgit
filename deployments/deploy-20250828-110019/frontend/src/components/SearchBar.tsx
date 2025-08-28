'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
    const t = useTranslations();
    const [q, setQ] = useState('');
    return (
        <div className="flex gap-2 w-full max-w-3xl">
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="flex-1 border rounded px-3 py-2 bg-transparent"
                placeholder={t('searchPlaceholder')}
            />
            <button onClick={() => onSearch(q)} className="px-4 py-2 rounded bg-black text-white dark:bg-white dark:text-black">
                {t('search')}
            </button>
        </div>
    );
} 