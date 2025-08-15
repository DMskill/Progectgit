import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
            },
        ],
        sitemap: [
            // Будет доступен /sitemap.xml
            (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/sitemap.xml',
        ],
    };
} 