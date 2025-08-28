'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
    const t = useTranslations();
    const locale = useLocale();
    return (
        <footer className="mt-10 py-6 border-t text-center text-sm opacity-80">
            <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
                <div className="flex items-center"><div>© {new Date().getFullYear()} ProP2P</div><a href="mailto:support@pro2p2.xyz" className="ml-20 hover:opacity-100 opacity-80 transition">support@pro2p2.xyz</a></div>
                <div className="flex items-center gap-3">
                    <Link href={`/${locale}/terms`} className="hover:opacity-100 opacity-80 transition">{t('footer.terms')}</Link>
                    <Link href={`/${locale}/privacy`} className="hover:opacity-100 opacity-80 transition">{t('footer.privacy')}</Link>
                </div>
            </div>
        </footer>
    );
} 
