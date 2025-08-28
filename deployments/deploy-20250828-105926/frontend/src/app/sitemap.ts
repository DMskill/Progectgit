import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const LOCALES = ['ru', 'en', 'zh', 'es', 'de'];

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();
    const urls: MetadataRoute.Sitemap = ['/', '/auth/sign-in', '/auth/sign-up', '/profile'].flatMap((p) =>
        LOCALES.map((l) => ({
            url: `${SITE}/${l}${p === '/' ? '' : p}`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: p === '/' ? 1 : 0.6,
        }))
    );
    return urls;
} 