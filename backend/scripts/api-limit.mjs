// API limit test: create 11 listings for one user and ensure 11th fails
const BASE = process.env.PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function randEmail() {
    const r = Math.random().toString(36).slice(2, 10);
    return `limit_${r}@test.local`;
}

async function postJson(url, body, headers = {}) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!res.ok) {
        const msg = data?.message ? (Array.isArray(data.message) ? data.message.join(', ') : data.message) : res.status + ' ' + res.statusText;
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }
    return data;
}

(async () => {
    const email = randEmail();
    console.log('EMAIL=', email);
    await postJson(`${BASE}/auth/register`, { name: 'Limit User', email, password: 'secret123' });
    const login = await postJson(`${BASE}/auth/login`, { email, password: 'secret123' });
    const token = login.accessToken;
    const hdr = { Authorization: `Bearer ${token}` };
    let ok = 0;
    for (let i = 1; i <= 11; i++) {
        try {
            await postJson(`${BASE}/listings`, {
                countryCode: 'RU', countryName: 'Россия', regionCity: 'Москва', action: 'BUY',
                cryptoSymbol: 'USDT', amountTotal: String(1000 + i), minTrade: '10', receiveType: 'CASH',
                contact: 'limit@test.local', description: `Limit test #${i}`,
            }, hdr);
            ok++;
            console.log('CREATE_OK', i);
        } catch (e) {
            console.log('CREATE_ERR', i, e.message);
            if (i === 11) {
                if (e.message.toLowerCase().includes('limit') || e.message.toLowerCase().includes('лимит') || e.status === 409) {
                    console.log('LIMIT_OK');
                    return;
                }
                throw e;
            }
        }
    }
    throw new Error(`Expected 10 successes then failure, got ${ok} successes`);
})().catch((err) => {
    console.error('LIMIT_FAIL:', err?.message || String(err));
    process.exitCode = 1;
}); 