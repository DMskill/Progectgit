// Simple API smoke test: register -> login -> create listing
// Run inside backend container: `node scripts/api-smoke.mjs`

const BASE = process.env.PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function randEmail() {
    const r = Math.random().toString(36).slice(2, 10);
    return `user_${r}@test.local`;
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
        throw new Error(msg);
    }
    return data;
}

(async () => {
    const email = randEmail();
    console.log('EMAIL=', email);
    await postJson(`${BASE}/auth/register`, { name: 'Smoke User', email, password: 'secret123' });
    console.log('REGISTER_OK');
    const login = await postJson(`${BASE}/auth/login`, { email, password: 'secret123' });
    console.log('LOGIN_OK');
    const token = login.accessToken;
    if (!token) throw new Error('No token');
    const created = await postJson(
        `${BASE}/listings`,
        {
            countryCode: 'RU',
            countryName: 'Россия',
            regionCity: 'Москва',
            action: 'BUY',
            cryptoSymbol: 'USDT',
            amountTotal: '1000',
            minTrade: '10',
            receiveType: 'CASH',
            contact: 'smoke@test.local',
            description: 'Smoke test listing',
        },
        { Authorization: `Bearer ${token}` },
    );
    console.log('CREATE_OK ID=', created?.id || 'unknown');
    console.log('SMOKE_OK');
})().catch((err) => {
    console.error('SMOKE_FAIL:', err?.message || String(err));
    process.exitCode = 1;
}); 