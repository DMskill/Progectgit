'use client';

import { useTranslations } from 'next-intl';

export default function TermsPage() {
    const t = useTranslations('termsPage');
    return (
        <main className="min-h-screen hero-gradient">
            <section className="py-6 flex flex-col items-center gap-6">
                <div className="w-full max-w-3xl px-4">
                    <h1 className="text-2xl font-bold mb-3">{t('title')}</h1>
                    <p className="opacity-80 mb-2">{t('p1')}</p>
                    <ul className="list-disc pl-5 opacity-80 space-y-1">
                        <li>{t('li1')}</li>
                        <li>{t('li2')}</li>
                        <li>{t('li3')}</li>
                    </ul>
                </div>
            </section>
        </main>
    );
} 