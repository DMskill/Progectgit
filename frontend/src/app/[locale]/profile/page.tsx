'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { getListings, getMe, ListingDto, updateProfile, changePassword, requestEmailChange, repostListing } from '@/lib/api';
import Header from '@/components/Header';
import ListingTable from '@/components/ListingTable';
import Link from 'next/link';
import { toast } from '@/components/Toast';

export default function ProfilePage() {
    const t = useTranslations();
    const locale = useLocale();
    const [me, setMe] = useState<{ email: string; name?: string | null; nickname?: string | null } | null>(null);
    const [items, setItems] = useState<ListingDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'active' | 'archived'>('active');

    const [name, setName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const meRes = await getMe();
            if (meRes?.user) {
                setMe({ email: meRes.user.email, name: meRes.user.name, nickname: meRes.user.nickname });
                setName(meRes.user.name ?? '');
                const list = await getListings(tab === 'archived' ? { seller: meRes.user.email, archived: '1' } : { seller: meRes.user.email });
                setItems(Array.isArray(list) ? list : []);
            } else {
                setMe(null);
                setItems([]);
            }
        } catch {
            setItems([]);
            setMe(null);
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [tab]);

    const handleEdited = (updated: ListingDto) => {
        setItems(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
    };
    const handleDeleted = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleRepost = async (id: string) => {
        try {
            await repostListing(id);
            setItems(prev => prev.filter(i => i.id !== id));
            toast(t('repost'), 'success');
        } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Error', 'error'); }
    };

    const saveProfile = async () => {
        try {
            const res = await updateProfile({ name: name.trim() || undefined });
            setMe(prev => prev ? { ...prev, name: res.user.name } : prev);
            toast(t('profile.updated'), 'success');
        } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Error', 'error'); }
    };

    const savePassword = async () => {
        try { await changePassword(currentPassword, newPassword); toast(t('profile.updated'), 'success'); setCurrentPassword(''); setNewPassword(''); } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Error', 'error'); }
    };

    const saveEmail = async () => {
        try { await requestEmailChange(newEmail); toast(t('profile.mailSent'), 'success'); setNewEmail(''); } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Error', 'error'); }
    };

    return (
        <main className="min-h-screen hero-gradient">
            <Header onCreated={load} />
            <section className="py-6 flex flex-col items-center gap-6">
                <div className="w-full max-w-6xl px-4">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-xl font-semibold">{t('profileTitle')}</h1>
                        <Link href={`/${locale}`} className="px-3 py-1 rounded border text-sm">{t('toListings')}</Link>
                    </div>
                    {me ? (
                        <div className="neon-inner border rounded p-3 mb-4 space-y-3">
                            <div><span className="opacity-60">Email:</span> {me.email}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <input className="ux-input" placeholder={t('profile.namePh')} value={name} onChange={e => setName(e.target.value)} />
                                <button className="px-3 py-1 rounded border" onClick={saveProfile}>{t('profile.saveProfile')}</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <input type="password" className="ux-input" placeholder={t('profile.currentPassPh')} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                                <input type="password" className="ux-input" placeholder={t('profile.newPassPh')} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                <button className="px-3 py-1 rounded border" onClick={savePassword}>{t('profile.changePass')}</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <input type="email" className="ux-input" placeholder={t('profile.newEmailPh')} value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                                <div />
                                <button className="px-3 py-1 rounded border" onClick={saveEmail}>{t('profile.changeEmail')}</button>
                            </div>
                        </div>
                    ) : (
                        <div className="opacity-60">{t('signIn')}…</div>
                    )}
                    <div className="flex gap-2 mb-3">
                        <button className={`pill ${tab === 'active' ? 'pill-active' : ''}`} onClick={() => setTab('active')}>{t('tabActive')}</button>
                        <button className={`pill ${tab === 'archived' ? 'pill-active' : ''}`} onClick={() => setTab('archived')}>{t('tabArchived')}</button>
                    </div>
                    <h2 className="text-lg font-semibold mb-2">{tab === 'active' ? t('myListings') : t('archive')}</h2>
                </div>
                {loading ? <div className="opacity-60">{t('loading')}</div> : (
                    <div className="w-full max-w-6xl px-4">
                        {tab === 'active' ? (
                            <ListingTable items={items} onEdited={handleEdited} onDeleted={handleDeleted} showRowActions showExpires hideSeller />
                        ) : (
                            <ListingTable items={items} archivedMode onRepost={handleRepost} showExpires hideSeller />
                        )}
                    </div>
                )}
            </section>
        </main>
    );
} 