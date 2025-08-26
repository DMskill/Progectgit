'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { BASE_URL } from '@/lib/api';

export default function SignUpModal() {
  const t = useTranslations();
  const tAuth = useTranslations('auth');
  const locale = useLocale();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  // Автооткрытие при переходе на /auth/sign-up
  useEffect(() => { if (pathname.endsWith('/auth/sign-up')) setOpen(true); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const submit = async () => {
    setLoading(true); setError(null); setOk(null); setVerifyUrl(null);
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Registration failed');
      if (data?.devVerifyUrl) { setOk(tAuth('devVerify')); setVerifyUrl(String(data.devVerifyUrl)); return; }
      setOk(tAuth('verifySent'));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Registration failed';
      setError(message);
    } finally { setLoading(false); }
  };

  const inputCls = 'w-full ux-input';

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-neon text-sm">{t('signUp')}</button>
      {open && (
        <div className="fixed inset-0 modal-backdrop z-50 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="absolute inset-x-0 top-20 bottom-6 flex items-start justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="neon-inner border modal-panel panel-gradient w-[92vw] max-w-xl p-6 space-y-4 animate-scale-in text-black dark:text-white bg-white/95 dark:bg-black/90 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center"><h3 className="text-xl font-extrabold tracking-wide">{t('signUp')}</h3></div>
                <button onClick={() => setOpen(false)} className="ml-3">✕</button>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              {ok ? (
                <div className="space-y-2 text_sm">
                  <div className="text-green-600">{ok}</div>
                  {verifyUrl && <a href={verifyUrl} target="_blank" rel="noreferrer" className="underline text-blue-500 break-all">{verifyUrl}</a>}
                </div>
              ) : (
                <div className="space-y-3">
                  <input className={inputCls} placeholder={t('profile.namePh')} value={name} onChange={e => setName(e.target.value)} />
                  <input className={inputCls} placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} />
                  <input type="password" className={inputCls} placeholder={tAuth('passwordMin')} value={password} onChange={e => setPassword(e.target.value)} />

                  <div className="pt-1">
                    <button
                      disabled={loading || !email.trim() || !password.trim()}
                      onClick={submit}
                      className="btn-neon disabled:opacity-50 inline-flex items-center gap-2 mx-auto"
                      style={{ display: 'block' }}
                    >
                      {loading && <span className="inline-block w-3 h-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />}
                      {t('signUp')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm opacity-80 pt-1">
                    <span className="invisible">.</span>
                    <a href={`/${locale}/auth/sign-in?forgot=1`} className="underline hover:opacity-100">
                      {t('forgotPassword') as string}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
