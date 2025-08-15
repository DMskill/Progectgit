'use client';

import { BASE_URL } from '@/lib/api';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUp() {
    const router = useRouter();
    const locale = useLocale();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);
    const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true); setError(null); setOk(null); setVerifyUrl(null);
        try {
            const res = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed');

            if (data.devVerifyUrl) {
                setOk('Регистрация успешна. Для подтверждения почты (dev-режим) перейдите по ссылке ниже.');
                setVerifyUrl(data.devVerifyUrl as string);
                return;
            }

            setOk('Проверьте почту, чтобы подтвердить аккаунт.');
            setTimeout(() => router.push(`/${locale}`), 2000);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Registration failed';
            setError(message);
        } finally { setLoading(false); }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm border rounded p-4 space-y-3">
                <h1 className="text-lg font-semibold">Sign up</h1>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                {ok && <div className="text-green-600 text-sm space-y-2">
                    <div>{ok}</div>
                    {verifyUrl && <a href={verifyUrl} target="_blank" rel="noreferrer" className="underline text-blue-500 break-all">{verifyUrl}</a>}
                </div>}
                {!ok && (
                    <>
                        <input className="w-full border rounded px-2 py-1" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                        <input className="w-full border rounded px-2 py-1" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input type="password" className="w-full border rounded px-2 py-1" placeholder="Password (min 6)" value={password} onChange={e => setPassword(e.target.value)} />
                    </>
                )}
                <div className="flex justify-end">
                    {!ok && <button disabled={loading} onClick={submit} className="px-3 py-1 rounded bg-black text-white dark:bg-white dark:text-black">Sign up</button>}
                </div>
            </div>
        </main>
    );
} 