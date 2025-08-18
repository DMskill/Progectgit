'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export default function VerifiedPage() {
    const locale = useLocale();
    const t = useTranslations('verified');

    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md border rounded-lg p-6 bg-white dark:bg-black">
                <h2 className="text-xl font-semibold mb-2">{t('title')}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {t('desc')}
                </p>
                <Link
                    href={`/${locale}`}
                    className="inline-block px-3 py-1 rounded bg-black text-white dark:bg-white dark:text-black"
                >
                    {t('homeBtn')}
                </Link>
            </div>
        </main>
    );
} 