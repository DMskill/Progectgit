export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem('accessToken'); } catch { return null; }
}

export function setToken(token: string) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('accessToken', token); } catch { }
    try { window.dispatchEvent(new Event('auth-changed')); } catch { }
}

export function clearToken() {
    if (typeof window === 'undefined') return;
    try { localStorage.removeItem('accessToken'); } catch { }
    try { window.dispatchEvent(new Event('auth-changed')); } catch { }
} 