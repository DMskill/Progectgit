export type ListingDto = {
    id: string;
    countryCode: string;
    countryName: string;
    regionCity: string;
    action: 'BUY' | 'SELL';
    cryptoSymbol: string;
    amountTotal: string;
    minTrade: string;
    receiveType: 'CASH' | 'CRYPTO' | 'BANK_TRANSFER' | 'GOODS';
    receiveTypes?: ('CASH' | 'CRYPTO' | 'BANK_TRANSFER' | 'GOODS')[];
    receiveAsset?: string;
    receiveAmount?: string;
    contact?: string;
    rating: number;
    description?: string;
    seller: { id: string; name?: string | null; nickname?: string | null; email: string };
    createdAt: string;
    expiresAt?: string;
    status?: 'ACTIVE' | 'ARCHIVED';
};

// Если NEXT_PUBLIC_API_URL не задан, используем фронтовый прокси /api (см. rewrites в next.config.ts)
export const BASE_URL = '/api';
import { getToken, clearToken } from './auth';

const IS_E2E = process.env.NEXT_PUBLIC_E2E === '1';

type Method = 'CASH' | 'CRYPTO' | 'BANK_TRANSFER' | 'GOODS';

export type ListingsQuery = Partial<{ country: string; city: string; crypto: string; action: 'BUY' | 'SELL'; seller: string; method: Method | Method[]; archived: '1' | 'true'; }>;
export type ListingsPagedResponse = { items: ListingDto[]; total: number; page: number; limit: number };

export async function getListings(params?: ListingsQuery): Promise<ListingDto[]> {
    if (IS_E2E) {
        return [];
    }
    let query = '';
    if (params) {
        const usp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            if (Array.isArray(v)) {
                v.filter(Boolean).forEach((vv) => usp.append(k, String(vv)));
            } else if (String(v).trim() !== '') {
                usp.append(k, String(v));
            }
        });
        const q = usp.toString();
        if (q) query = '?' + q;
    }
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/listings${query}`, { cache: 'no-store', headers });
    if (!res.ok) throw new Error('Failed to load listings');
    return res.json();
}

export async function getListingsPaged(params?: ListingsQuery & { page?: number; limit?: number }): Promise<ListingsPagedResponse> {
    if (IS_E2E) {
        return { items: [], total: 0, page: 1, limit: Number(params?.limit || 50) };
    }
    try {
        const usp = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                if (v === undefined || v === null) return;
                if (k === 'page' && Number(v) === 1) return;
                if (k === 'limit' && Number(v) === 50) return;
                if (Array.isArray(v)) v.filter(Boolean).forEach((vv) => usp.append(k, String(vv)));
                else if (String(v).trim() !== '') usp.append(k, String(v));
            });
        }
        const q = usp.toString();
        const query = q ? `?${q}` : '';
        const headers: Record<string, string> = {};
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${BASE_URL}/listings/paged${query}`, { cache: 'no-store', headers });
        if (res.ok) return res.json();
        if (res.status === 400) {
            const usp2 = new URLSearchParams();
            if (params) {
                Object.entries(params).forEach(([k, v]) => {
                    if (v === undefined || v === null) return;
                    if (k === 'page' || k === 'limit') return;
                    if (Array.isArray(v)) v.filter(Boolean).forEach((vv) => usp2.append(k, String(vv)));
                    else if (String(v).trim() !== '') usp2.append(k, String(v));
                });
            }
            const q2 = usp2.toString();
            const query2 = q2 ? `?${q2}` : '';
            const res2 = await fetch(`${BASE_URL}/listings/paged${query2}`, { cache: 'no-store', headers });
            if (res2.ok) return res2.json();
        }
    } catch { }
    // Полный фолбэк: берём /listings и пагинируем на клиенте
    const page = Math.max(1, Number(params?.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params?.limit || 50)));
    const all = await getListings(params);
    const start = (page - 1) * limit;
    return { items: all.slice(start, start + limit), total: all.length, page, limit };
}

export async function repostListing(id: string): Promise<ListingDto> {
    if (IS_E2E) {
        return Promise.reject(new Error('Disabled in e2e'));
    }
    const token = getToken();
    if (!token) throw new Error('Unauthorized');
    const res = await fetch(`${BASE_URL}/listings/${id}/repost`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to repost listing');
    return res.json();
}

export async function createListing(body: Record<string, unknown>): Promise<ListingDto> {
    if (IS_E2E) {
        return Promise.reject(new Error('Disabled in e2e'));
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/listings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        if (res.status === 401) {
            clearToken();
            throw new Error('Unauthorized');
        }
        let message = 'Failed to create listing';
        try {
            const data = await res.json();
            if (data?.message) {
                message = Array.isArray(data.message) ? data.message.join(', ') : String(data.message);
            }
        } catch { }
        throw new Error(message);
    }
    return res.json();
}

export async function updateListing(id: string, body: Record<string, unknown>): Promise<ListingDto> {
    if (IS_E2E) {
        return Promise.reject(new Error('Disabled in e2e'));
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/listings/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to update listing');
    return res.json();
}

export async function deleteListing(id: string): Promise<{ ok: true }> {
    if (IS_E2E) {
        return Promise.reject(new Error('Disabled in e2e'));
    }
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/listings/${id}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error('Failed to delete listing');
    return res.json();
}

export async function getMe(): Promise<{ user: { id: string; email: string; name?: string | null; nickname?: string | null; verified: boolean } } | null> {
    if (IS_E2E) return null;
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return res.json();
}

export async function updateProfile(body: { name?: string; nickname?: string }): Promise<{ user: { id: string; email: string; name?: string | null; nickname?: string | null; verified: boolean } }> {
    if (IS_E2E) return Promise.reject(new Error('Disabled in e2e'));
    const token = getToken();
    if (!token) throw new Error('Unauthorized');
    const res = await fetch(`${BASE_URL}/auth/profile`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ ok: true }> {
    if (IS_E2E) return Promise.reject(new Error('Disabled in e2e'));
    const token = getToken();
    if (!token) throw new Error('Unauthorized');
    const res = await fetch(`${BASE_URL}/auth/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentPassword, newPassword }) });
    if (!res.ok) throw new Error('Failed to change password');
    return res.json();
}

export async function requestEmailChange(newEmail: string): Promise<{ ok: true }> {
    if (IS_E2E) return Promise.reject(new Error('Disabled in e2e'));
    const token = getToken();
    if (!token) throw new Error('Unauthorized');
    const res = await fetch(`${BASE_URL}/auth/request-email-change`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ newEmail }) });
    if (!res.ok) throw new Error('Failed to request email change');
    return res.json();
} 