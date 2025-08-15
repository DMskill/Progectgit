import { test, expect } from '@playwright/test';

const pages = ['/ru', '/ru/auth/sign-in', '/ru/profile'];

for (const path of pages) {
    test(`no console errors on ${path}`, async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        await page.goto(path);
        // Дать странице загрузиться и выполнить эффекты
        await page.waitForTimeout(500);
        expect(errors).toEqual([]);
    });

    test(`no failed network requests on ${path}`, async ({ page }) => {
        const failures: { url: string; status?: number }[] = [];
        page.on('response', (res) => {
            // Проверяем только наш хост
            const url = res.url();
            if (!url.startsWith('http://localhost:3000')) return;
            const status = res.status();
            if (status >= 400) failures.push({ url, status });
        });
        await page.goto(path);
        await page.waitForTimeout(500);
        expect(failures).toEqual([]);
    });
} 