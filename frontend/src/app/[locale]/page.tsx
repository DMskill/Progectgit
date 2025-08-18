'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Header from '@/components/Header';
import ListingTable from '@/components/ListingTable';
import { getListingsPaged, ListingDto } from '@/lib/api';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CountrySelect from '@/components/CountrySelect';
import Link from 'next/link';

type Filters = {
    country: string;
    city: string;
    action: '' | 'BUY' | 'SELL';
    crypto: string;
    seller: string;
    method: '' | 'CASH' | 'CRYPTO' | 'BANK_TRANSFER' | 'GOODS';
};

const ACTIONS = new Set(['BUY', 'SELL']);
const METHODS = new Set(['CASH', 'CRYPTO', 'BANK_TRANSFER', 'GOODS']);

export default function Home() {
    const t = useTranslations();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const actionSelectRef = useRef<HTMLSelectElement | null>(null);

    const [items, setItems] = useState<ListingDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [safetyOpen, setSafetyOpen] = useState(false);
    const [page, setPage] = useState<number>(Number(searchParams.get('page') || 1) || 1);
    const [total, setTotal] = useState<number>(0);

    const PER_PAGE = 50;

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PER_PAGE)), [total]);
    const pagedItems = useMemo(() => {
        const start = (page - 1) * PER_PAGE;
        return items.slice(start, start + PER_PAGE);
    }, [items, page]);

    const initialFilters = useMemo<Filters>(() => {
        const rawAction = searchParams.get('action') ?? '';
        const action = ACTIONS.has(rawAction) ? (rawAction as Filters['action']) : '';
        const rawMethod = searchParams.get('method') ?? '';
        const method = METHODS.has(rawMethod) ? (rawMethod as Filters['method']) : '';
        return {
            country: searchParams.get('country') ?? '',
            city: searchParams.get('city') ?? '',
            action,
            crypto: searchParams.get('crypto') ?? '',
            seller: searchParams.get('seller') ?? '',
            method,
        };
    }, [searchParams]);

    const [filters, setFilters] = useState<Filters>(initialFilters);
    const didInitRef = useRef(false);

    const buildParams = (f: Filters) => {
        const obj: Record<string, string> = {};
        if (f.country.trim()) obj.country = f.country.trim();
        if (f.city.trim()) obj.city = f.city.trim();
        if (f.action && ACTIONS.has(f.action)) obj.action = f.action;
        if (f.crypto.trim()) obj.crypto = f.crypto.trim();
        if (f.seller.trim()) obj.seller = f.seller.trim();
        if (f.method && METHODS.has(f.method)) obj.method = f.method;
        return obj;
    };

    const syncUrl = (f: Filters, pageNumber: number) => {
        const usp = new URLSearchParams();
        const p = buildParams(f);
        Object.entries(p).forEach(([k, v]) => usp.append(k, v));
        if (pageNumber > 1) usp.set('page', String(pageNumber)); else usp.delete('page');
        const q = usp.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    };

    const load = useCallback(async (f?: Filters, pageOverride?: number) => {
        setLoading(true);
        try {
            const base = buildParams(f ?? filters);
            const params = { ...base, page: Number(pageOverride ?? page), limit: PER_PAGE } as unknown as Parameters<typeof getListingsPaged>[0];
            const all = await getListingsPaged(params);
            setItems(all.items);
            setTotal(all.total);
            const targetPage = Math.max(1, Number(pageOverride ?? page) || 1);
            setPage(targetPage);
        } catch {
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    const applyWith = (f: Filters) => {
        const pageNumber = 1;
        setPage(pageNumber);
        syncUrl(f, pageNumber);
        load(f, pageNumber);
    };

    useEffect(() => {
        if (didInitRef.current) return;
        didInitRef.current = true;
        const normalized: Filters = initialFilters;
        setFilters(normalized);
        setPage(1);
        load(normalized, 1);
    }, [initialFilters, load]);

    const apply = () => {
        const currentAction = actionSelectRef.current?.value as Filters['action'] | undefined;
        const nextAction = currentAction && ACTIONS.has(currentAction) ? currentAction : '';
        const merged: Filters = { ...filters, action: nextAction };
        applyWith(merged);
    };

    const reset = () => {
        const empty: Filters = { country: '', city: '', action: '', crypto: '', seller: '', method: '' };
        setFilters(empty);
        setPage(1);
        syncUrl(empty, 1);
        load(empty, 1);
    };

    const handleEdited = (updated: ListingDto) => {
        setItems(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
    };
    const handleDeleted = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    return (
        <main className="min-h-screen hero-gradient">
            <Header onCreated={() => load(undefined, 1)} />
            <section className="py-6 flex flex-col items-center gap-6">
                <div className="w-full max-w-6xl px-4">
                    <div className="mb-4">
                        <div className="badge-soft mb-2">⚡ {t('brand')}</div>
                        <h1 className="text-2xl md:text-4xl font-extrabold mb-2 tracking-tight">
                            {(() => {
                                const s = t('hero.title') as unknown as string;
                                const idx = s.indexOf('P2P');
                                if (idx === -1) return s;
                                return <>
                                    {s.slice(0, idx)}
                                    <span className="text-cyan-400">P2P</span>
                                    {s.slice(idx + 3)}
                                </>;
                            })()}
                        </h1>
                        <p className="text-base md:text-lg opacity-80 leading-relaxed max-w-2xl">{t('hero.subtitle')}</p>
                    </div>

                    <div className="neon-wrap mb-4">
                        <div className="neon-inner p-3">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const fd = new FormData(e.currentTarget as HTMLFormElement);
                                    const rawAction = String(fd.get('action') ?? '');
                                    const next: Filters = {
                                        country: String(fd.get('country') ?? '').trim(),
                                        city: String(fd.get('city') ?? '').trim(),
                                        action: (ACTIONS.has(rawAction) ? (rawAction as Filters['action']) : ''),
                                        crypto: String(fd.get('crypto') ?? '').trim(),
                                        seller: String(fd.get('seller') ?? '').trim(),
                                        method: (METHODS.has(String(fd.get('method') ?? '')) ? (String(fd.get('method') ?? '') as Filters['method']) : ''),
                                    };
                                    setFilters(next);
                                    applyWith(next);
                                }}
                            >
                                <div data-testid="filters" className="grid grid-cols-1 md:grid-cols-6 gap-2">
                                    {/* 1. Страна */}
                                    <div>
                                        <input type="hidden" name="country" value={filters.country} />
                                        <CountrySelect value={filters.country} onChange={(name) => setFilters(p => ({ ...p, country: name }))} placeholder={t('filter.country')} />
                                    </div>
                                    {/* 2. Город */}
                                    <input name="city" className="ux-input ux-select focus-ux" placeholder={t('filter.city')} value={filters.city} onChange={e => setFilters(p => ({ ...p, city: e.target.value }))} />
                                    {/* 3. Покупка/Продажа */}
                                    <select name="action" ref={actionSelectRef} className="ux-select focus-ux" value={filters.action} onChange={e => {
                                        const val = e.target.value as Filters['action'];
                                        const next = { ...filters, action: (ACTIONS.has(val) ? val : '') };
                                        setFilters(next);
                                    }}>
                                        <option value="">{t('filter.actionAny')}</option>
                                        <option value="BUY">{t('action.buy')}</option>
                                        <option value="SELL">{t('action.sell')}</option>
                                    </select>
                                    {/* 4. Криптовалюта */}
                                    <input name="crypto" className="ux-input focus-ux" placeholder={t('filter.crypto')} value={filters.crypto} onChange={e => setFilters(p => ({ ...p, crypto: e.target.value }))} />
                                    {/* 5. Продавец */}
                                    <input name="seller" className="ux-input focus-ux" placeholder={t('filter.seller')} value={filters.seller} onChange={e => setFilters(p => ({ ...p, seller: e.target.value }))} />
                                    {/* 6. Метод оплаты */}
                                    <select name="method" className="ux-select focus-ux" value={filters.method} onChange={e => setFilters(p => ({ ...p, method: (METHODS.has(e.target.value) ? (e.target.value as Filters['method']) : '') }))}>
                                        <option value="">{t('filter.method')}</option>
                                        <option value="CASH">{t('method.cash')}</option>
                                        <option value="CRYPTO">{t('method.crypto')}</option>
                                        <option value="BANK_TRANSFER">{t('method.bank')}</option>
                                        <option value="GOODS">{t('method.goods')}</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button type="submit" data-testid="apply-filters" className="btn-neon">{t('filter.apply')}</button>
                                    <button type="button" data-testid="reset-filters" onClick={reset} className="px-3 py-1 rounded border hover:bg-gray-50 dark:hover:bg-gray-900 transition">{t('filter.reset')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                {loading ? <div className="opacity-60">{t('loading')}</div> : <>
                    <ListingTable items={pagedItems} onEdited={handleEdited} onDeleted={handleDeleted} showExpires={false} sellerHeader={t('colContact') as unknown as string} />
                    {total > 0 && (
                        <div className="w-full max-w-6xl px-4 mt-2 text-sm opacity-70">
                            {t('list.countRange', { from: Math.min((page - 1) * PER_PAGE + 1, total), to: Math.min(total, page * PER_PAGE), total })}
                        </div>
                    )}
                    {total > PER_PAGE && (
                        <nav className="w-full max-w-6xl px-4 mt-4 flex items-center justify-center select-none" data-testid="pagination" aria-label="Pagination">
                            <div className="flex items-center gap-2">
                                <button type="button" className="px-2 py-1 rounded border hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40" disabled={page <= 1} onClick={() => { const next = Math.max(1, page - 1); setPage(next); syncUrl(filters, next); load(filters, next); }} aria-label="Prev">‹</button>
                                {(() => {
                                    const pages: (number | string)[] = [];
                                    const add = (v: number | string) => pages.push(v);
                                    const max = totalPages;
                                    const cur = page;
                                    const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
                                    add(1);
                                    const left = Math.max(2, cur - 2);
                                    const right = Math.min(max - 1, cur + 2);
                                    if (left > 2) add('...');
                                    range(left, right).forEach(n => add(n));
                                    if (right < max - 1) add('...');
                                    if (max > 1) add(max);
                                    return (
                                        <>
                                            {pages.map((p, idx) => {
                                                if (typeof p === 'string') {
                                                    return <span key={`e-${idx}`} className="px-2 text-gray-500">{p}</span>;
                                                }
                                                return (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => { setPage(p as number); syncUrl(filters, p as number); load(filters, p as number); }}
                                                        className={`${p === page ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50 dark:hover:bg-gray-900'} px-3 py-1 rounded`}
                                                    >
                                                        {p}
                                                    </button>
                                                );
                                            })}
                                        </>
                                    );
                                })()}
                                <button type="button" className="px-2 py-1 rounded border hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40" disabled={page >= totalPages} onClick={() => { const next = Math.min(totalPages, page + 1); setPage(next); syncUrl(filters, next); load(filters, next); }} aria-label="Next">›</button>
                            </div>
                        </nav>
                    )}
                </>}

                <div className="w-full max-w-6xl px-4">
                    <div className="cta-card p-6 mt-6">
                        <h3 className="text-2xl font-semibold mb-1">{t('blocks.howWorks.title')}</h3>
                        <div className="opacity-80 max-w-3xl leading-relaxed space-y-1">
                            <div>{t('blocks.howWorks.find')}</div>
                            <div>{t('blocks.howWorks.post')}</div>
                            <div>{t('blocks.howWorks.tip')}</div>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-6xl px-4 grid grid-cols-1 md:grid-cols-3 gap-3 my-6">
                    <div className="faq-item p-4">
                        <div className="font-semibold mb-1">{t('blocks.safety.title')}</div>
                        <div className="opacity-80 text-sm md:text-base leading-relaxed">
                            {t('blocks.safety.short')}
                            <br />
                            <button type="button" onClick={() => setSafetyOpen(true)} className="underline text-cyan-400">{t('blocks.safety.more')}</button>
                        </div>
                    </div>
                    <div className="faq-item p-4">
                        <div className="font-semibold mb-1">{t('blocks.contact.title')}</div>
                        <div className="opacity-80 text-sm md:text-base leading-relaxed">{t('blocks.contact.text')}</div>
                    </div>
                    <div className="faq-item p-4">
                        <div className="font-semibold mb-1">{t('blocks.fees.title')}</div>
                        <div className="opacity-80 text-sm md:text-base leading-relaxed">{t('blocks.fees.text')}</div>
                    </div>
                </div>

                {safetyOpen && (
                    <div className="fixed inset-0 modal-backdrop z-50 animate-fade-in" onClick={() => setSafetyOpen(false)}>
                        <div className="absolute inset-x-0 top-20 bottom-10 flex items-start justify-center p-4" onClick={(e) => e.stopPropagation()}>
                            <div className="neon-inner border rounded-xl w-[92vw] max-w-2xl max-h-full overflow-y-auto p-5 space-y-3 animate-scale-in">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">{t('safetyModal.title')}</h3>
                                    <button onClick={() => setSafetyOpen(false)}>✕</button>
                                </div>
                                <ul className="list-disc pl-5 opacity-80 text-sm md:text-base leading-relaxed space-y-1">
                                    <li>{t('safetyModal.item1')}</li>
                                    <li>{t('safetyModal.item2')}</li>
                                    <li>{t('safetyModal.item3')}</li>
                                    <li>{t('safetyModal.item4')}</li>
                                    <li>{t('safetyModal.item5')}</li>
                                    <li>{t('safetyModal.item6')}</li>
                                    <li>{t('safetyModal.item7')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
} 