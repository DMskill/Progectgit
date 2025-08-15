'use client';

import { BASE_URL } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
    const t = useTranslations();
    const router = useRouter();
    const locale = useLocale();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
            const data = await res.json();
            setToken(data.accessToken);
            // Выполняем полную перезагрузку, чтобы хедер перечитал токен надёжно
            if (typeof window !== 'undefined') {
                window.location.href = `/${locale}`;
                return;
            }
            router.push(`/${locale}`);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Login failed';
            setError(message);
        } finally { setLoading(false); }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm border rounded p-4 space-y-3 bg-white dark:bg-black">
                <h1 className="text-lg font-semibold">{t('signIn')}</h1>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <input className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-900 text-black dark:text-white" placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-900 text-black dark:text-white" placeholder={t('password')} value={password} onChange={e => setPassword(e.target.value)} />
                <div className="flex justify-end">
                    <button disabled={loading} onClick={submit} className="px-3 py-1 rounded bg-black text-white dark:bg-white dark:text-black">{t('signIn')}</button>
                </div>
            </div>
        </main>
    );
} 