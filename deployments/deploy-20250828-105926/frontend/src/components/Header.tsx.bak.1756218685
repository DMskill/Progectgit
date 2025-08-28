'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import CreateListingModal from '@/components/CreateListingModal';
import SignUpModal from '@/components/SignUpModal';
import SignInModal from '@/components/SignInModal';
import { clearToken, getToken } from '@/lib/auth';
import { useEffect, useMemo, useState } from 'react';
import { getMe } from '@/lib/api';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

export default function Header({ onCreated }: { onCreated: () => void }) {
    const t = useTranslations();
    const locale = useLocale();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const readAuth = () => {
            const token = getToken();
            if (!token) { setUserEmail(null); setIsAdmin(false); return; }
            getMe().then((res) => {
                const email = res?.user.email ?? null;
                setUserEmail(email);
                if (email && ADMIN_EMAILS.includes(email.toLowerCase())) setIsAdmin(true);
            }).catch(() => { setUserEmail(null); setIsAdmin(false); });
        };
        readAuth();
        const onStorage = (e: StorageEvent) => { if (!e.key || e.key === 'accessToken') readAuth(); };
        const onFocus = () => readAuth();
        const onAuthChanged = () => readAuth();
        window.addEventListener('storage', onStorage);
        window.addEventListener('focus', onFocus);
        window.addEventListener('auth-changed', onAuthChanged as unknown as EventListener);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('auth-changed', onAuthChanged as unknown as EventListener);
        };
    }, []);

    useEffect(() => {
        // дополнительная проверка через ping (если список не задан)
        if (isAdmin) return;
        const token = getToken();
        if (!token) { setIsAdmin(false); return; }
        fetch('/api/admin/ping', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => { if (r.ok) setIsAdmin(true); })
            .catch(() => { });
    }, [userEmail]);

    const logout = () => { clearToken(); setUserEmail(null); setIsAdmin(false); };

    return (
        <header data-testid="app-header" className="p-3 border-b flex items-center justify-between sticky top-0 bg-white/70 dark:bg-black/70 backdrop-blur z-40 shadow-sm">
            <Link href={`/${locale}`} className="font-semibold text-lg hover:opacity-90 transition link-ux">{t('brand')}</Link>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
                {userEmail ? (
                    <>
                        {isAdmin && (
                            <Link href={`/${locale}/admin`} className="px-3 py-1 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition link-ux">Админ</Link>
                        )}
                        <Link href={`/${locale}/profile`} className="px-3 py-1 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition link-ux">{t('myListings')}</Link>
                        <span className="text-sm opacity-70 hidden md:inline">{userEmail}</span>
                        <button onClick={logout} className="px-3 py-1 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition" data-testid="logout-btn">{t('logout')}</button>
                        <CreateListingModal onCreated={onCreated} />
import SignUpModal from '@/components/SignUpModal';
import SignInModal from '@/components/SignInModal';
                    </>
                ) : (
                    <>
                        <Link href={`/${locale}/auth/sign-in`} className="px-3 py-1 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition link-ux" data-testid="sign-in-btn">{t('signIn')}</Link>
                        <Link href={`/${locale}/auth/sign-up`} className="btn-neon text-sm" data-testid="sign-up-btn">{t('signUp')}</Link>
                    </>
                )}
            </div>
        </header>
    );
} 