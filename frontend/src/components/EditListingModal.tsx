'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ListingDto, updateListing } from '@/lib/api';
import { useTranslations } from 'next-intl';
import CountrySelect from '@/components/CountrySelect';

const MAX_COMMENT = 500;
const MAX_DECIMALS = 9;
const MIN_DECIMALS_DISPLAY = 5;
const MAX_INT_DIGITS = 20;
type Method = 'CASH' | 'CRYPTO' | 'BANK_TRANSFER' | 'GOODS';

function sanitizeDecimalInput(value: string, maxDecimals: number): string {
    if (!value) return '';
    let v = value.replace(',', '.').replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
    const hadDot = v.includes('.');
    let [i, d = ''] = v.split('.');
    if (d) d = d.slice(0, maxDecimals);
    if (i.length > MAX_INT_DIGITS) i = i.slice(0, MAX_INT_DIGITS);
    return hadDot ? `${i}${d !== '' ? `.${d}` : '.'}` : i;
}

function formatDecimalForBlur(value: string, maxDecimals: number, minDecimals: number): string {
    if (!value) return '';
    const v = value.replace(',', '.');
    if (!/^[0-9]*\.?[0-9]*$/.test(v)) return value;
    if (!v.includes('.')) {
        const i = v.replace(/^0+(\d)/, '$1');
        return i.length > MAX_INT_DIGITS ? i.slice(0, MAX_INT_DIGITS) : i;
    }
    const num = Number(v);
    if (!isFinite(num)) return value;
    const rounded = num.toFixed(Math.min(maxDecimals, 18));
    let [i, d = ''] = rounded.split('.');
    d = d.replace(/0+$/g, '');
    if (d.length < minDecimals) d = d.padEnd(minDecimals, '0');
    i = String(Number(i));
    if (i.length > MAX_INT_DIGITS) i = i.slice(0, MAX_INT_DIGITS);
    return d.length ? `${i}.${d}` : i;
}

export default function EditListingModal({ item, onSaved, icon = false }: { item: ListingDto; onSaved: (updated: ListingDto) => void; icon?: boolean }) {
    const t = useTranslations();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        countryCode: item.countryCode,
        countryName: item.countryName,
        regionCity: item.regionCity,
        action: item.action,
        cryptoSymbol: item.cryptoSymbol,
        amountTotal: item.amountTotal,
        minTrade: item.minTrade,
        receiveTypes: (item.receiveTypes && item.receiveTypes.length > 0 ? item.receiveTypes : [item.receiveType]) as Method[],
        receiveAsset: item.receiveAsset ?? '',
        receiveAmount: item.receiveAmount ?? '',
        contact: item.contact ?? '',
        description: item.description ?? ''
    });

    const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const isValid = useMemo(() => {
        return (
            form.countryName.trim() !== '' &&
            form.cryptoSymbol.trim() !== ''
        );
    }, [form]);

    const submit = async () => {
        setLoading(true); setError(null);
        try {
            const body: Record<string, unknown> = {
                countryCode: form.countryCode,
                countryName: form.countryName,
                regionCity: form.regionCity,
                action: form.action,
                cryptoSymbol: form.cryptoSymbol,
                amountTotal: form.amountTotal,
                minTrade: form.minTrade,
                receiveType: form.receiveTypes[0],
                receiveTypes: form.receiveTypes,
                receiveAsset: form.receiveAsset || undefined,
                receiveAmount: form.receiveAmount || undefined,
                contact: form.contact || undefined,
                description: form.description || undefined,
            };
            const updated = await updateListing(item.id, body);
            setOpen(false);
            onSaved(updated);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to update listing';
            setError(msg);
        } finally { setLoading(false); }
    };

    const inputCls = 'border rounded px-2 py-1 bg-white dark:bg-gray-900 text-black dark:text-white placeholder:opacity-60';
    const selectCls = 'border rounded px-2 py-1 bg-white dark:bg-gray-900 text-black dark:text-white';

    const [methodsOpen, setMethodsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className={icon ? 'h-8 w-8 p-1 rounded border inline-flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 icon-hover' : 'px-2 py-1 rounded border'}
                aria-label={t('edit')}
                title={t('edit')}
            >
                {icon ? (
                    // Pencil icon (inline SVG)
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
                        <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor" />
                    </svg>
                ) : (
                    t('edit')
                )}
            </button>
            {open && createPortal(
                <div className="fixed inset-0 modal-backdrop z-50 animate-fade-in" onClick={() => setOpen(false)}>
                    <div className="flex min-h-full items-start justify-center p-4 pt-20 pb-6" onClick={(e) => e.stopPropagation()}>
                        <div className="neon-inner border modal-panel w-[92vw] max-w-3xl max-h-[80vh] overflow-y-auto p-5 space-y-4 animate-scale-in scroll-ux text-black dark:text-white">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">{t('modal.editTitle')}</h3>
                                <button onClick={() => setOpen(false)}>✕</button>
                            </div>
                            {error && <div className="text-red-500 text-sm">{error}</div>}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <CountrySelect
                                    value={form.countryName}
                                    onChange={(name, code) => setForm(p => ({ ...p, countryName: name, countryCode: code ?? p.countryCode }))}
                                    placeholder={t('modal.countryPh')}
                                />
                                <input className={inputCls} placeholder={t('modal.regionPh')} value={form.regionCity} onChange={e => update('regionCity', e.target.value)} />
                                <select className={selectCls} value={form.action} onChange={e => update('action', e.target.value)}>
                                    <option value="BUY">{t('modal.action.buy')}</option>
                                    <option value="SELL">{t('modal.action.sell')}</option>
                                </select>
                                <input className={inputCls} placeholder={t('modal.cryptoPh')} value={form.cryptoSymbol} onChange={e => update('cryptoSymbol', e.target.value)} />
                                <input inputMode="decimal" className={inputCls} placeholder={t('modal.amountTotalPh')} value={form.amountTotal} onChange={e => update('amountTotal', sanitizeDecimalInput(e.target.value, MAX_DECIMALS))} onBlur={e => update('amountTotal', formatDecimalForBlur(e.target.value, MAX_DECIMALS, MIN_DECIMALS_DISPLAY))} />
                                <input inputMode="decimal" className={inputCls} placeholder={t('modal.minTradePh')} value={form.minTrade} onChange={e => update('minTrade', sanitizeDecimalInput(e.target.value, MAX_DECIMALS))} onBlur={e => update('minTrade', formatDecimalForBlur(e.target.value, MAX_DECIMALS, MIN_DECIMALS_DISPLAY))} />
                                {/* Premium multiselect for methods */}
                                <div className="dropdown">
                                    <div className="ux-select px-2 py-1 cursor-pointer" onClick={() => setMethodsOpen(v => !v)}>
                                        <div className="chips">
                                            {form.receiveTypes.length === 0 && <span className="opacity-60">{t('modal.receiveTypeSelect')}</span>}
                                            {form.receiveTypes.map(m => (
                                                <span key={m} className="chip">{t(m === 'CASH' ? 'modal.receiveType.cash' : m === 'CRYPTO' ? 'modal.receiveType.crypto' : m === 'BANK_TRANSFER' ? 'modal.receiveType.bank' : 'modal.receiveType.goods')}<span className="x" onClick={() => setForm(p => ({ ...p, receiveTypes: p.receiveTypes.filter(x => x !== m) }))}>✕</span></span>
                                            ))}
                                        </div>
                                    </div>
                                    {methodsOpen && (
                                        <div className="dropdown-panel" onClick={(e) => e.stopPropagation()}>
                                            {(['CASH', 'CRYPTO', 'BANK_TRANSFER', 'GOODS'] as Method[]).map(m => (
                                                <label key={m} className="dropdown-option">
                                                    <input type="checkbox" checked={form.receiveTypes.includes(m)} onChange={() => setForm(p => ({ ...p, receiveTypes: p.receiveTypes.includes(m) ? p.receiveTypes.filter(x => x !== m) : [...p.receiveTypes, m] }))} />
                                                    <span>{t(m === 'CASH' ? 'modal.receiveType.cash' : m === 'CRYPTO' ? 'modal.receiveType.crypto' : m === 'BANK_TRANSFER' ? 'modal.receiveType.bank' : 'modal.receiveType.goods')}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <input className={inputCls} placeholder={t('modal.giveReceiveAssetPh')} value={form.receiveAsset} onChange={e => update('receiveAsset', e.target.value)} />
                                <input inputMode="decimal" className={inputCls} placeholder={t('modal.receiveAmountPh')} value={form.receiveAmount} onChange={e => update('receiveAmount', sanitizeDecimalInput(e.target.value, MAX_DECIMALS))} onBlur={e => update('receiveAmount', formatDecimalForBlur(e.target.value, MAX_DECIMALS, MIN_DECIMALS_DISPLAY))} />
                                <input className={inputCls} placeholder={t('modal.sellerEmailPh')} value={form.contact} onChange={e => update('contact', e.target.value)} />
                                <div className="md:col-span-2">
                                    <input className={`w-full ${inputCls}`} maxLength={MAX_COMMENT} placeholder={t('modal.commentPh')} value={form.description} onChange={e => update('description', e.target.value.slice(0, MAX_COMMENT))} />
                                    <div className="text-xs opacity-60 mt-1 text-right">{form.description.length}/{MAX_COMMENT}</div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setOpen(false)} className="px-3 py-1 rounded border">{t('modal.cancel')}</button>
                                <button disabled={loading || !isValid} onClick={submit} className="px-3 py-1 rounded bg-black text-white dark:bg-white dark:text-black disabled:opacity-50 inline-flex items-center gap-2">
                                    {loading && <span className="inline-block w-3 h-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />}
                                    {t('modal.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>, document.body)
            }
        </>
    );
} 