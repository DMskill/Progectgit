'use client';

import { ListingDto } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { getToken } from '@/lib/auth';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { COUNTRIES } from '@/lib/countries';
import { getMe, deleteListing } from '@/lib/api';
import EditListingModal from '@/components/EditListingModal';
import RowCard from '@/components/RowCard';
import React from 'react';

const MethodIcon = ({ type }: { type: ListingDto['receiveType'] }) => {
    const common = 'inline-block mr-1 align-[-2px]';
    switch (type) {
        case 'CASH':
            return <svg className={common} width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>;
        case 'CRYPTO':
            return <svg className={common} width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l8.66 5v10L12 22 3.34 17V7L12 2z" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M12 7v10" stroke="currentColor" strokeWidth="1.5" /></svg>;
        case 'BANK_TRANSFER':
            return <svg className={common} width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9l9-6 9 6v10H3V9z" stroke="currentColor" strokeWidth="1.5" /><path d="M7 19V9h10v10" stroke="currentColor" strokeWidth="1.5" /></svg>;
        case 'GOODS':
            return <svg className={common} width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 8V6a4 4 0 118 0v2" stroke="currentColor" strokeWidth="1.5" /></svg>;
        default:
            return null;
    }
};

// Удалён неиспользуемый StarIcon
const StarIconHeader = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26 6.91 1-5 4.87 1.18 6.87L12 18.9l-6.18 3.1L7 14.13 2 9.26l6.91-1L12 2z" /></svg>
);

const CommentIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16v12H7l-3 3V4z" /></svg>
);
const CommentIconHeader = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16v12H7l-3 3V4z" /></svg>
);

export default function ListingTable({ items, onEdited, onDeleted, showRowActions = false, archivedMode = false, onRepost, showExpires = false, sellerHeader, hideSeller = false }: { items: ListingDto[]; onEdited?: (item: ListingDto) => void; onDeleted?: (id: string) => void; showRowActions?: boolean; archivedMode?: boolean; onRepost?: (id: string) => void; showExpires?: boolean; sellerHeader?: string; hideSeller?: boolean; }) {
    const t = useTranslations();
    const locale = useLocale();
    const [myEmail, setMyEmail] = useState<string | null>(null);
    const [preview, setPreview] = useState<{ open: boolean; title: string; text: string }>({ open: false, title: '', text: '' });

    useEffect(() => {
        getMe().then(res => setMyEmail(res?.user.email ?? null)).catch(() => setMyEmail(null));
    }, []);

    const hasToken = typeof window !== 'undefined' && !!getToken();

    // Показывать "Срок" только в профиле
    const effectiveShowExpires = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return !!showExpires && window.location.pathname.includes('/profile');
    }, [showExpires]);

    const methodKey: Record<ListingDto['receiveType'], 'cash' | 'crypto' | 'bank' | 'goods'> = {
        CASH: 'cash',
        CRYPTO: 'crypto',
        BANK_TRANSFER: 'bank',
        GOODS: 'goods',
    };

    const formatAction = (a: ListingDto['action']) => (a === 'BUY' ? t('action.buy') : t('action.sell'));
    const formatMethod = (m: ListingDto['receiveType']) => t(`method.${methodKey[m]}`);
    const formatMethodShort = (m: ListingDto['receiveType']) => t(`method.${methodKey[m]}`);

    const daysLeft = (i: ListingDto) => {
        if (!i.expiresAt || i.status === 'ARCHIVED') return null;
        const now = new Date();
        const end = new Date(i.expiresAt);
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff <= 0) return null;
        return diff;
    };

    const onDelete = async (id: string) => {
        if (!confirm(t('delete') + '?')) return;
        try {
            await deleteListing(id);
            onDeleted?.(id);
        } catch {
            location.reload();
        }
    };

    const lastColWidth = (showRowActions || archivedMode) ? 'md:w-[20%]' : 'md:w-[8%]';
    const methodColWidth = (showRowActions || archivedMode) ? 'md:w-[10%]' : 'md:w-[11%]';
    const buySellColWidth = 'md:w-[12%]';

    const CellButton = ({ title, text, textString, className = '' }: { title: string; text: React.ReactNode; textString?: string; className?: string }) => (
        <button
            onClick={() => setPreview({ open: true, title, text: textString ?? (typeof text === 'string' ? text : '') })}
            className={`block w-full text-left truncate hover:underline decoration-cyan-300/60 ${className}`}
            title={`${title}: ${textString ?? (typeof text === 'string' ? text : '')}`}
            aria-label={`${title}: ${textString ?? (typeof text === 'string' ? text : '')}`}
        >
            {text}
        </button>
    );

    const sellerContact = (i: ListingDto) => (hasToken ? (i.contact || i.description || '—') : '••••');

    const HeaderCell = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
        <div className={`px-3 py-3 text-sm capitalize tracking-normal font-medium text-gray-700 dark:text-gray-300 ${className}`}>{children}</div>
    );

    const Cell = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
        <div className={`px-2 md:px-3 py-2 truncate ${className}`}>{children}</div>
    );

    const commentPreview = (text?: string | null) => {
        const s = (text ?? '').trim();
        if (!s) return '-';
        const short = s.slice(0, 5);
        return s.length > 5 ? `${short}…` : short;
    };

    const renderExpireBadge = (i: ListingDto) => {
        const left = daysLeft(i);
        if (left == null) return <span className="opacity-60">—</span>;
        const base = 'px-2 py-0.5 rounded-full text-xs whitespace-nowrap border';
        const tone = left <= 3
            ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30'
            : left <= 7
                ? 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30'
                : 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30';
        return <span className={`${base} ${tone}`}>{t('daysCount', { count: left })}</span>;
    };

    const countryCodesSet = useMemo(() => new Set(COUNTRIES.map(c => c.code.toUpperCase())), []);
    const getDisplayCountry = (i: ListingDto) => {
        const code = (i.countryCode || '').toUpperCase();
        if (code && countryCodesSet.has(code)) {
            try {
                const dn = new Intl.DisplayNames([locale], { type: 'region' });
                const localized = dn.of(code) as string | undefined;
                return localized || i.countryName;
            } catch {
                return i.countryName;
            }
        }
        return i.countryName;
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            <div className="overflow-x-auto border rounded">
                {/* Заголовок: скрываем на мобильных, показываем на md+ */}
                <div className="hidden md:flex items-center border-b rounded-t-md bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 shadow-sm text-[13px]" aria-hidden={false}>
                    <HeaderCell className="w-[9%] text-left">{t('colCountry')}</HeaderCell>
                    <HeaderCell className="w-[10%] text-left">{t('colCity')}</HeaderCell>
                    <HeaderCell className={`${buySellColWidth} text-left`}>{t('colBuySell')}</HeaderCell>
                    <HeaderCell className="w-[7%] text-left">{t('colCrypto')}</HeaderCell>
                    <HeaderCell className="w-[9%] text-right">{t('colAmount')}</HeaderCell>
                    <HeaderCell className="w-[8%] text-right">{t('colMinTrade')}</HeaderCell>
                    <HeaderCell className="w-[11%] text-left">{t('colGiveReceive')}</HeaderCell>
                    <HeaderCell className={`${methodColWidth} text-left`}>{t('colMethod')}</HeaderCell>
                    {!hideSeller && (
                        <HeaderCell className="w-[9%] text-left">{sellerHeader ?? t('colSeller')}</HeaderCell>
                    )}
                    {effectiveShowExpires && (
                        <HeaderCell className="w-[10%] text-left">{t('colExpires')}</HeaderCell>
                    )}
                    {!showRowActions && !archivedMode && (
                        <HeaderCell className="w-[5%] text-center">
                            <span title={t('colRating')} aria-label={t('colRating')} className="inline-flex items-center justify-center w-full"><StarIconHeader /></span>
                        </HeaderCell>
                    )}
                    <HeaderCell className={`${lastColWidth} text-center`}>
                        {(showRowActions || archivedMode) ? t('colActions') : (
                            <span title={t('colDescription')} aria-label={t('colDescription')} className="inline-flex items-center justify-center w-full"><CommentIconHeader /></span>
                        )}
                    </HeaderCell>
                </div>

                {/* Список строк */}
                <div data-testid="listing-table" role="table" className="text-[13px]">
                    {items.map((i, idx) => (
                        <RowCard zebraIndex={idx} key={i.id} delayMs={idx < 10 ? idx * 25 : 0}>
                            <div className="contents md:row-divide-x">
                                <Cell className="w-1/2 md:w-[9%]"><CellButton title={t('colCountry')} text={getDisplayCountry(i)} /></Cell>
                                <Cell className="w-1/2 md:w-[10%]"><CellButton title={t('colCity')} text={i.regionCity} /></Cell>
                                <Cell className={`w-1/2 ${buySellColWidth}`}>
                                    <CellButton title={t('colBuySell')} text={<span className={`badge ${i.action === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>{formatAction(i.action)}</span>} textString={formatAction(i.action)} />
                                </Cell>
                                <Cell className="w-1/2 md:w-[7%]"><CellButton title={t('colCrypto')} text={i.cryptoSymbol} /></Cell>
                                <Cell className="w-1/2 md:w-[9%] text-right"><CellButton title={t('colAmount')} text={i.amountTotal} className="text-right" /></Cell>
                                <Cell className="w-1/2 md:w-[8%] text-right"><CellButton title={t('colMinTrade')} text={i.minTrade} className="text-right" /></Cell>
                                <Cell className="w-full md:w-[11%]"><CellButton title={t('colGiveReceive')} text={`${i.receiveAsset ?? '-'} ${i.receiveAmount ?? ''}`} /></Cell>
                                <Cell className={`w-1/2 ${methodColWidth}`}>
                                    {i.receiveTypes && i.receiveTypes.length > 0 ? (
                                        <CellButton
                                            title={t('colMethod')}
                                            text={<><MethodIcon type={i.receiveTypes[0]} />{formatMethodShort(i.receiveTypes[0])}</>}
                                            textString={i.receiveTypes.map(m => formatMethodShort(m)).join(', ')}
                                        />
                                    ) : (
                                        <CellButton title={t('colMethod')} text={<><MethodIcon type={i.receiveType} />{formatMethod(i.receiveType)}</>} textString={formatMethod(i.receiveType)} />
                                    )}
                                </Cell>
                                {!hideSeller && (
                                    <Cell className="w-full md:w-[9%]"><CellButton title={sellerHeader ?? t('colSeller')} text={sellerContact(i)} /></Cell>
                                )}
                                {effectiveShowExpires && <Cell className="w-full md:w-[10%]">{renderExpireBadge(i)}</Cell>}
                                {!showRowActions && !archivedMode && <Cell className="hidden md:block md:w-[5%] text-center">{i.rating.toFixed(1)}</Cell>}
                                <Cell className={`w-full ${lastColWidth} text-right`}>
                                    {showRowActions ? (
                                        myEmail && (i.seller.email === myEmail) ? (
                                            <div className="flex items-center gap-2 justify-end overflow-hidden">
                                                <EditListingModal item={i} onSaved={(updated) => onEdited?.(updated)} icon />
                                                <button className="btn-outline btn-danger whitespace-nowrap" onClick={() => onDelete(i.id)}>{t('delete')}</button>
                                            </div>
                                        ) : (
                                            <span className="opacity-50">—</span>
                                        )
                                    ) : archivedMode ? (
                                        <div className="flex justify-end">
                                            <button className="btn-outline whitespace-nowrap" onClick={() => onRepost?.(i.id)}>{t('repost')}</button>
                                        </div>
                                    ) : (
                                        <CellButton
                                            title={t('colDescription')}
                                            text={<span className="inline-flex items-center gap-1"><CommentIcon /><span className="max-w-[5ch] truncate text-gray-600 dark:text-gray-400">{commentPreview(i.description)}</span></span>}
                                            textString={i.description ?? '-'}
                                        />
                                    )}
                                </Cell>
                            </div>
                        </RowCard>
                    ))}
                    {items.length === 0 && (
                        <div className="p-4 text-center text-gray-500">{t('empty')}</div>
                    )}
                </div>
            </div>

            {preview.open && (
                <div className="fixed inset-0 modal-backdrop z-50 animate-fade-in" onClick={() => setPreview({ open: false, title: '', text: '' })}>
                    <div className="absolute inset-x-0 top-24 bottom-24 flex items-start justify-center p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="neon-inner border rounded-xl w-[92vw] max-w-2xl max-h-full overflow-y-auto p-5 space-y-4 animate-scale-in">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">{preview.title}</h3>
                                <button onClick={() => setPreview({ open: false, title: '', text: '' })}>✕</button>
                            </div>
                            <div className="whitespace-pre-wrap break-words">{preview.text || '-'}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 