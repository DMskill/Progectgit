'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { BASE_URL } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function SignInModal() {
  const t = useTranslations();
  const tAuth = useTranslations('auth');
  const locale = useLocale();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Автооткрытие при переходе на /auth/sign-in
  useEffect(() => { if (pathname.endsWith('/auth/sign-in')) setOpen(true); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const submit = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data?.accessToken) throw new Error(data?.message || 'Login failed');
      setToken(data.accessToken);
      setOpen(false);
      window.location.href = `/${locale}`;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed';
      setError(message);
    } finally { setLoading(false); }
  };

  const inputCls = 'w-full ux-input';

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-3 py-1 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition">
        {t('signIn')}
      </button>

      {open && (
        <div className="fixed inset-0 modal-backdrop z-50 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="absolute inset-x-0 top-20 bottom-6 flex items-start justify_center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="neon-inner border modal-panel panel-gradient w-[92vw] max-w-xl p-6 space-y-4 animate-scale-in text-black dark:text-white bg-white/95 dark:bg-black/90 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <h3 className="text-xl font-extrabold tracking-wide">{t('signIn')}</h3>
                </div>
                <button onClick={() => setOpen(false)} className="ml-3">✕</button>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="space-y-3">
                <input className={inputCls} placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" className={inputCls} placeholder={tAuth('passwordMin')} value={password} onChange={e => setPassword(e.target.value)} />

                <div className="pt-1">
                  <button
                    disabled={loading || !email.trim() || !password.trim()}
                    onClick={submit}
                    className="btn-neon disabled:opacity-50 inline-flex items-center gap-2 mx-auto"
                    style={{ display: 'block' }}
                  >
                    {loading && <span className="inline-block w-3 h-3 border-2 border-white/70 border_t-transparent rounded-full animate-spin" />}
                    {t('signIn')}
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm opacity-80 pt-1">
                  <span className="invisible">.</span>
                  <a href={`/${locale}/auth/sign-in?forgot=1`} className="underline hover:opacity-100">
                    {t('forgotPassword') as string}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { BASE_URL } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function SignInModal() {
  const t = useTranslations();
  const tAuth = useTranslations('auth');
  const locale = useLocale();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Автооткрытие при переходе на /auth/sign-in
  useEffect(() => { if (pathname.endsWith('/auth/sign-in')) setOpen(true); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const submit = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data?.accessToken) throw new Error(data?.message || 'Login failed');
      setToken(data.accessToken);
      setOpen(false);
      window.location.href = `/${locale}`;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed';
      setError(message);
    } finally { setLoading(false); }
  };

  const inputCls = 'w-full ux-input';

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-3 py-1 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition">
        {t('signIn')}
      </button>

      {open && (
        <div className="fixed inset-0 modal-backdrop z-50 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="absolute inset-x-0 top-20 bottom-6 flex items-start justify_center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="neon-inner border modal-panel panel-gradient w-[92vw] max-w-xl p-6 space-y-4 animate-scale-in text-black dark:text-white bg-white/95 dark:bg-black/90 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <h3 className="text-xl font-extrabold tracking-wide">{t('signIn')}</h3>
                </div>
                <button onClick={() => setOpen(false)} className="ml-3">✕</button>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="space-y-3">
                <input className={inputCls} placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" className={inputCls} placeholder={tAuth('passwordMin')} value={password} onChange={e => setPassword(e.target.value)} />

                <div className="pt-1">
                  <button
                    disabled={loading || !email.trim() || !password.trim()}
                    onClick={submit}
                    className="btn-neon disabled:opacity-50 inline-flex items-center gap-2 mx-auto"
                    style={{ display: 'block' }}
                  >
                    {loading && <span className="inline-block w-3 h-3 border-2 border-white/70 border_t-transparent rounded-full animate-spin" />}
                    {t('signIn')}
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm opacity-80 pt-1">
                  <span className="invisible">.</span>
                  <a href={`/${locale}/auth/sign-in?forgot=1`} className="underline hover:opacity-100">
                    {t('forgotPassword') as string}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
