'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { createListing, ListingDto } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { getToken } from '@/lib/auth';
import CountrySelect from '@/components/CountrySelect';
import { toast } from '@/components/Toast';

const MAX_COMMENT = 500;
const MAX_DECIMALS = 9;
const MIN_DECIMALS_DISPLAY = 5;
const MAX_INT_DIGITS = 20;
type Method = 'CASH' | 'CRYPTO' | 'BANK_TRANSFER' | 'GOODS';

function sanitizeDecimalInput(value: string, maxDecimals: number): string {
    if (!value) return '';
    let v = value.replace(',', '.').replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
        v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
    }
    const hadDot = v.includes('.');
    let [intPart, decPart = ''] = v.split('.');
    if (decPart) decPart = decPart.slice(0, maxDecimals);
    if (intPart.length > MAX_INT_DIGITS) intPart = intPart.slice(0, MAX_INT_DIGITS);
    return hadDot ? `${intPart}${decPart !== '' ? `.${decPart}` : '.'}` : intPart;
}

function formatDecimalForBlur(value: string, maxDecimals: number, minDecimals: number): string {
    if (!value) return '';
    const v = value.replace(',', '.');
    if (!/^[0-9]*\.?[0-9]*$/.test(v)) return value; // leave as is if unusual
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

export default function CreateListingModal({ onCreated }: { onCreated: (created?: ListingDto) => void }) {
    const t = useTranslations();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        countryName: '',
        countryCode: '',
        regionCity: '',
        action: '' as '' | 'BUY' | 'SELL',
        cryptoSymbol: '',
        amountTotal: '',
        minTrade: '',
        receiveTypes: [] as Method[],
        receiveAsset: '',
        receiveAmount: '',
        contact: '',
        description: ''
    });

    const [methodsOpen, setMethodsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (open) {
            const original = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = original; };
        }
    }, [open]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setMethodsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const isValid = useMemo(() => {
        return (
            form.countryName.trim() !== '' &&
            form.cryptoSymbol.trim() !== '' &&
            form.contact.trim() !== '' &&
            form.action !== '' &&
            form.receiveTypes.length > 0
        );
    }, [form]);

    const deriveCountryCode = (countryName: string) => {
        if (form.countryCode) return form.countryCode; // from picker
        const trimmed = (countryName || '').trim().toUpperCase();
        return trimmed.length >= 2 ? trimmed.slice(0, 2) : 'XX';
    };

    const submit = async () => {
        const token = getToken();
        if (!token) {
            setError(t('needAuthToCreate'));
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const amount = form.amountTotal.trim() === '' ? '0' : form.amountTotal.trim();
            const min = form.minTrade.trim() === '' ? '0' : form.minTrade.trim();
            const body: Record<string, unknown> = {
                countryCode: deriveCountryCode(form.countryName),
                countryName: form.countryName,
                regionCity: form.regionCity,
                action: form.action,
                cryptoSymbol: form.cryptoSymbol,
                amountTotal: amount,
                minTrade: min,
                receiveType: form.receiveTypes[0],
                receiveTypes: form.receiveTypes,
                receiveAsset: form.receiveAsset || undefined,
                receiveAmount: form.receiveAmount || undefined,
                contact: form.contact,
                description: form.description || undefined,
            };
            const created = await createListing(body);
            toast(t('profile.updated'), 'success');
            setOpen(false);
            onCreated(created);
        } catch (e) {
            const message = e instanceof Error ? (e.message === 'Unauthorized' ? t('unauthorized') : e.message) : t('modal.error');
            setError(message);
            toast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = 'ux-input';
    const selectCls = 'ux-select';

    return (
        <>
            <button onClick={() => setOpen(true)} className="btn-neon text-sm">{t('postAd')}</button>
            {open && (
                <div className="fixed inset-0 modal-backdrop z-50 animate-fade-in" onClick={() => setOpen(false)}>
                    <div className="absolute inset-x-0 top-20 bottom-6 flex items-start justify-center p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="neon-inner border modal-panel panel-gradient w-[92vw] max-w-3xl max-h-full min-h-[60vh] overflow-y-auto p-5 space-y-4 animate-scale-in scroll-ux text-black dark:text-white">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">{t('modal.title')}</h3>
                                <button onClick={() => setOpen(false)}>✕</button>
                            </div>
                            {error && <div className="text-red-500 text-sm">{error}</div>}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <CountrySelect
                                    value={form.countryName}
                                    onChange={(name, code) => setForm(p => ({ ...p, countryName: name, countryCode: code ?? '' }))}
                                    placeholder={t('modal.countryPh')}
                                />
                                <input className={inputCls} placeholder={t('modal.regionPh')} value={form.regionCity} onChange={e => update('regionCity', e.target.value)} />
                                <select className={selectCls} value={form.action} onChange={e => update('action', e.target.value)}>
                                    <option value="">{t('modal.actionSelect')}</option>
                                    <option value="BUY">{t('modal.action.buy')}</option>
                                    <option value="SELL">{t('modal.action.sell')}</option>
                                </select>
                                <input className={inputCls} placeholder={t('modal.cryptoPh')} value={form.cryptoSymbol} onChange={e => update('cryptoSymbol', e.target.value)} />
                                <input inputMode="decimal" className={inputCls} placeholder={t('modal.amountTotalPh')} value={form.amountTotal} onChange={e => update('amountTotal', sanitizeDecimalInput(e.target.value, MAX_DECIMALS))} onBlur={e => update('amountTotal', formatDecimalForBlur(e.target.value, MAX_DECIMALS, MIN_DECIMALS_DISPLAY))} />
                                <input inputMode="decimal" className={inputCls} placeholder={t('modal.minTradePh')} value={form.minTrade} onChange={e => update('minTrade', sanitizeDecimalInput(e.target.value, MAX_DECIMALS))} onBlur={e => update('minTrade', formatDecimalForBlur(e.target.value, MAX_DECIMALS, MIN_DECIMALS_DISPLAY))} />
                                {/* Premium multiselect */}
                                <div className="dropdown" ref={dropdownRef}>
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
                                <input className={inputCls} placeholder={t('modal.receiveAssetPh')} value={form.receiveAsset} onChange={e => update('receiveAsset', e.target.value)} />
                                <input inputMode="decimal" className={inputCls} placeholder={t('modal.receiveAmountPh')} value={form.receiveAmount} onChange={e => update('receiveAmount', sanitizeDecimalInput(e.target.value, MAX_DECIMALS))} onBlur={e => update('receiveAmount', formatDecimalForBlur(e.target.value, MAX_DECIMALS, MIN_DECIMALS_DISPLAY))} />
                                <input className={inputCls} placeholder={t('modal.sellerEmailPh')} value={form.contact} onChange={e => update('contact', e.target.value)} />
                                <div className="md:col-span-2">
                                    <input className={`w-full ${inputCls}`} maxLength={MAX_COMMENT} placeholder={t('modal.commentPh')} value={form.description} onChange={e => update('description', e.target.value.slice(0, MAX_COMMENT))} />
                                    <div className="text-xs opacity-60 mt-1 text-right">{form.description.length}/{MAX_COMMENT}</div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setOpen(false)} className="px-3 py-1 rounded border">{t('modal.cancel')}</button>
                                <button disabled={loading || !isValid} onClick={submit} className="btn-neon disabled:opacity-50 inline-flex items-center gap-2">
                                    {loading && <span className="inline-block w-3 h-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />}
                                    {t('modal.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 