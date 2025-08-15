'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const locales = ['ru', 'en', 'zh', 'es', 'de'] as const;

export default function LanguageSwitcher() {
    const active = useLocale();
    const pathname = usePathname();

    const buildHref = (target: string) => {
        // pathname like /ru, /ru/..., /en/...
        const parts = pathname.split('/');
        // ['', 'locale', ...rest]
        const rest = parts.slice(2).join('/');
        const suffix = rest ? `/${rest}` : '';
        return `/${target}${suffix}`;
    };

    return (
        <nav className="flex gap-2">
            {locales.map((l) => (
                <Link
                    key={l}
                    href={buildHref(l)}
                    className={`pill text-xs ${l === active ? 'pill-active' : ''}`}
                >
                    {l.toUpperCase()}
                </Link>
            ))}
        </nav>
    );
} 