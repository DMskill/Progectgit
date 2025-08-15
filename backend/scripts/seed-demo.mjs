// Minimal seeder for local/dev usage
// Creates 6 users and 10 listings per user (total 60)
// Usage inside container: node scripts/seed-demo.mjs

const BASE = process.env.API_BASE || 'http://localhost:3001';

async function post(path, body, token) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) {
        let txt;
        try { txt = await res.text(); } catch { }
        throw new Error(`POST ${path} ${res.status}: ${txt}`);
    }
    return res.json();
}

async function ensureRegistered(email, password, name) {
    try {
        await post('/auth/register', { email, password, name });
    } catch (e) {
        // ignore "already registered"
    }
    const { accessToken } = await post('/auth/login', { email, password });
    return accessToken;
}

function sample(i, j) {
    const countries = [
        { code: 'RU', name: 'Russia' },
        { code: 'US', name: 'United States' },
        { code: 'DE', name: 'Germany' },
        { code: 'ES', name: 'Spain' },
        { code: 'CN', name: 'China' },
    ];
    const c = countries[(i + j) % countries.length];
    const actions = ['BUY', 'SELL'];
    const cryptos = ['USDT', 'BTC', 'ETH'];
    const methods = ['CASH', 'BANK_TRANSFER', 'CRYPTO', 'GOODS'];
    return {
        countryCode: c.code,
        countryName: c.name,
        regionCity: `City ${j + 1}`,
        action: actions[(i + j) % 2],
        cryptoSymbol: cryptos[(i + j) % cryptos.length],
        amountTotal: String(1000 + j),
        minTrade: String(10 + (j % 5)),
        receiveType: methods[(i + j) % methods.length],
        receiveTypes: [methods[(i + j) % methods.length]],
        receiveAsset: (j % 2 === 0) ? 'RUB' : 'USD',
        receiveAmount: String(100 * (j + 1)),
        description: `Seed item ${j + 1} by user ${i + 1}`,
    };
}

(async () => {
    const users = Array.from({ length: 6 }, (_, i) => ({
        email: `pager${i + 1}@prop2p.local`,
        password: 'password123',
        name: `Pager ${i + 1}`,
    }));

    for (let i = 0; i < users.length; i++) {
        const u = users[i];
        const token = await ensureRegistered(u.email, u.password, u.name);
        for (let j = 0; j < 10; j++) {
            const body = sample(i, j);
            await post('/listings', body, token);
        }
        console.log(`User ${u.email}: 10 listings created`);
    }
    console.log('Seed complete');
})().catch((e) => {
    console.error('Seed failed:', e?.message || e);
    process.exit(1);
}); 