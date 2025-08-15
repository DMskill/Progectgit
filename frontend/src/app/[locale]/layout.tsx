import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { notFound } from 'next/navigation';
import { ToastHost } from '@/components/Toast';
import Link from 'next/link';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const LOCALES = ['ru', 'en', 'zh', 'es', 'de'];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    let messages: { brand?: string; hero?: { title?: string; subtitle?: string } };
    try {
        messages = (await import(`../../messages/${locale}.json`)).default;
    } catch {
        // fallback
        messages = { brand: 'ProP2P', hero: { title: 'P2P deals', subtitle: '' } };
    }
    const title = `${messages.brand} — ${messages.hero?.title ?? 'P2P deals'}`;
    const description = messages.hero?.subtitle ?? 'Peer-to-peer crypto classifieds';

    const languages: Record<string, string> = {};
    LOCALES.forEach(l => { languages[l] = `${SITE}/${l}`; });

    return {
        title,
        description,
        alternates: {
            canonical: `${SITE}/${locale}`,
            languages,
        },
        openGraph: {
            title,
            description,
            url: `${SITE}/${locale}`,
            siteName: 'ProP2P',
            locale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

function Footer({ locale }: { locale: string }) {
    const t = useTranslations();
    return (
        <footer className="mt-10 py-6 border-t text-center text-sm opacity-80">
            <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
                <div>© {new Date().getFullYear()} ProP2P</div>
                <div className="flex items-center gap-3">
                    <Link href={`/${locale}/terms`} className="hover:opacity-100 opacity-80 transition">{t('footer.terms')}</Link>
                    <Link href={`/${locale}/privacy`} className="hover:opacity-100 opacity-80 transition">{t('footer.privacy')}</Link>
                </div>
            </div>
        </footer>
    );
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: { locale: string };
}) {
    const { locale } = params;

    let messages;
    try {
        messages = (await import(`../../messages/${locale}.json`)).default;
    } catch {
        notFound();
    }

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
            <Footer locale={locale} />
            <ToastHost />
        </NextIntlClientProvider>
    );
}