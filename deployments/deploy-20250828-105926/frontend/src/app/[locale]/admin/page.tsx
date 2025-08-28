"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

type UserRow = { id: string; email: string; name?: string | null; nickname?: string | null; verified: boolean; createdAt: string };
type ListingRow = { id: string; countryCode: string; countryName: string; regionCity: string; cryptoSymbol: string; action: string; status: string; createdAt: string; description?: string | null; contact?: string | null };

const API = "/api";

export default function AdminPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [listings, setListings] = useState<ListingRow[]>([]);
    const [q, setQ] = useState("");
    const token = useMemo(() => getToken(), []);
    const [editUser, setEditUser] = useState<UserRow | null>(null);
    const [editListing, setEditListing] = useState<ListingRow | null>(null);

    useEffect(() => {
        if (!token) {
            router.replace("../");
            return;
        }
        void load();
    }, [token]);

    async function api(path: string, opts?: RequestInit) {
        const res = await fetch(`${API}${path}`, {
            ...opts,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(opts?.headers || {}),
            },
        });
        if (res.status === 401 || res.status === 403) {
            alert("Доступ запрещён");
            router.replace("../");
            return null;
        }
        return res;
    }

    async function load() {
        const [u, l] = await Promise.all([
            api(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
            api(`/admin/listings${q ? `?q=${encodeURIComponent(q)}` : ""}`),
        ]);
        if (u && u.ok) setUsers(await u.json());
        if (l && l.ok) setListings(await l.json());
    }

    async function ban(id: string) {
        const res = await api(`/admin/users/${id}/ban`, { method: "PATCH" });
        if (res && res.ok) await load();
    }
    async function unban(id: string) {
        const res = await api(`/admin/users/${id}/unban`, { method: "PATCH" });
        if (res && res.ok) await load();
    }
    async function delListing(id: string) {
        if (!confirm("Удалить объявление?")) return;
        const res = await api(`/admin/listings/${id}`, { method: "DELETE" });
        if (res && res.ok) await load();
    }
    async function archiveListing(id: string) {
        const res = await api(`/admin/listings/${id}/archive`, { method: "PATCH" });
        if (res && res.ok) await load();
    }

    async function saveUser(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editUser) return;
        const form = new FormData(e.currentTarget);
        const body: Record<string, unknown> = {
            name: form.get('name')?.toString() || undefined,
            nickname: form.get('nickname')?.toString() || undefined,
            verified: form.get('verified') === 'on',
        };
        let res = await api(`/admin/users/${editUser.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        if (res && res.status === 404) {
            res = await api(`/admin/users/update`, { method: 'POST', body: JSON.stringify({ id: editUser.id, ...body }) });
        }
        if (res && res.ok) { setEditUser(null); await load(); }
    }

    async function saveListing(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editListing) return;
        const form = new FormData(e.currentTarget);
        const body: Record<string, unknown> = {
            countryCode: form.get('countryCode')?.toString() || undefined,
            countryName: form.get('countryName')?.toString() || undefined,
            regionCity: form.get('regionCity')?.toString() || undefined,
            action: form.get('action')?.toString() || undefined,
            cryptoSymbol: form.get('cryptoSymbol')?.toString() || undefined,
            amountTotal: form.get('amountTotal')?.toString() || undefined,
            minTrade: form.get('minTrade')?.toString() || undefined,
            receiveType: form.get('receiveType')?.toString() || undefined,
            receiveAsset: form.get('receiveAsset')?.toString() || null,
            receiveAmount: form.get('receiveAmount')?.toString() || undefined,
            description: form.get('description')?.toString() || null,
            contact: form.get('contact')?.toString() || null,
        };
        let res = await api(`/admin/listings/${editListing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        if (res && res.status === 404) {
            res = await api(`/admin/listings/update`, { method: 'POST', body: JSON.stringify({ id: editListing.id, ...body }) });
        }
        if (res && res.ok) { setEditListing(null); await load(); }
    }

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-xl font-bold">Admin</h1>
            <div className="flex gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" className="ux-input w-full" />
                <button className="ux-btn" onClick={() => load()}>Найти</button>
            </div>

            <section>
                <h2 className="font-semibold mb-2">Пользователи</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left">
                                <th className="p-2">Email</th>
                                <th className="p-2">Имя</th>
                                <th className="p-2">Ник</th>
                                <th className="p-2">Вериф.</th>
                                <th className="p-2">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-t border-white/10">
                                    <td className="p-2">{u.email}</td>
                                    <td className="p-2">{u.name || "—"}</td>
                                    <td className="p-2">{u.nickname || "—"}</td>
                                    <td className="p-2">{u.verified ? "да" : "нет"}</td>
                                    <td className="p-2 space-x-2">
                                        <button className="ux-btn" onClick={() => setEditUser(u)}>Редактировать</button>
                                        <button className="ux-btn" onClick={() => ban(u.id)}>Забанить</button>
                                        <button className="ux-btn" onClick={() => unban(u.id)}>Разбанить</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section>
                <h2 className="font-semibold mb-2">Объявления</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left">
                                <th className="p-2">ID</th>
                                <th className="p-2">Страна</th>
                                <th className="p-2">Город</th>
                                <th className="p-2">Крипта</th>
                                <th className="p-2">Действие</th>
                                <th className="p-2">Статус</th>
                                <th className="p-2">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listings.map(l => (
                                <tr key={l.id} className="border-t border-white/10">
                                    <td className="p-2">{l.id.slice(0, 6)}</td>
                                    <td className="p-2">{l.countryCode} / {l.countryName}</td>
                                    <td className="p-2">{l.regionCity}</td>
                                    <td className="p-2">{l.cryptoSymbol}</td>
                                    <td className="p-2">{l.action}</td>
                                    <td className="p-2">{l.status}</td>
                                    <td className="p-2 space-x-2">
                                        <button className="ux-btn" onClick={() => setEditListing(l)}>Редактировать</button>
                                        <button className="ux-btn" onClick={() => archiveListing(l.id)}>Архив</button>
                                        <button className="ux-btn" onClick={() => delListing(l.id)}>Удалить</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {editUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
                    <form onSubmit={saveUser} className="bg-black border rounded p-4 space-y-3 w-full max-w-md">
                        <h3 className="font-semibold">Редактировать пользователя</h3>
                        <div>
                            <label className="block text-sm opacity-80">Имя</label>
                            <input name="name" defaultValue={editUser.name || ''} className="ux-input w-full" />
                        </div>
                        <div>
                            <label className="block text-sm opacity-80">Ник</label>
                            <input name="nickname" defaultValue={editUser.nickname || ''} className="ux-input w-full" />
                        </div>
                        <label className="inline-flex items-center gap-2"><input type="checkbox" name="verified" defaultChecked={editUser.verified} /> Верифицирован</label>
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setEditUser(null)} className="ux-btn">Отмена</button>
                            <button type="submit" className="ux-btn">Сохранить</button>
                        </div>
                    </form>
                </div>
            )}

            {editListing && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
                    <form onSubmit={saveListing} className="bg-black border rounded p-4 space-y-3 w-full max-w-2xl grid grid-cols-2 gap-3">
                        <h3 className="font-semibold col-span-2">Редактировать объявление</h3>
                        <input name="countryCode" defaultValue={editListing.countryCode} className="ux-input" placeholder="Код страны" />
                        <input name="countryName" defaultValue={editListing.countryName} className="ux-input" placeholder="Страна" />
                        <input name="regionCity" defaultValue={editListing.regionCity} className="ux-input col-span-2" placeholder="Город" />
                        <input name="cryptoSymbol" defaultValue={editListing.cryptoSymbol} className="ux-input" placeholder="Крипта" />
                        <select name="action" defaultValue={editListing.action} className="ux-input"><option value="BUY">BUY</option><option value="SELL">SELL</option></select>
                        <input name="amountTotal" className="ux-input" placeholder="Объём" />
                        <input name="minTrade" className="ux-input" placeholder="Мин. сделка" />
                        <select name="receiveType" defaultValue="" className="ux-input">
                            <option value="">Метод оплаты</option>
                            <option value="CASH">CASH</option>
                            <option value="CRYPTO">CRYPTO</option>
                            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                            <option value="GOODS">GOODS</option>
                        </select>
                        <input name="receiveAsset" defaultValue={editListing.contact || ''} className="ux-input" placeholder="Получаю (актив)" />
                        <input name="receiveAmount" className="ux-input" placeholder="Сумма" />
                        <textarea name="description" defaultValue={editListing.description || ''} className="ux-input col-span-2" placeholder="Описание" />
                        <input name="contact" defaultValue={editListing.contact || ''} className="ux-input col-span-2" placeholder="Контакт" />
                        <div className="flex gap-2 justify-end col-span-2">
                            <button type="button" onClick={() => setEditListing(null)} className="ux-btn">Отмена</button>
                            <button type="submit" className="ux-btn">Сохранить</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
} 