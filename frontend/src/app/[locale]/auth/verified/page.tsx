'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function VerifiedPage() {
    const locale = useLocale();

    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md border rounded-lg p-6 bg-white dark:bg-black">
                <h2 className="text-xl font-semibold mb-2">Email confirmed</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Your email has been successfully verified. You can now continue to use ProP2P.
                </p>
                <Link
                    href={`/${locale}`}
                    className="inline-block px-3 py-1 rounded bg-black text-white dark:bg-white dark:text-black"
                >
                    Go to homepage
                </Link>
            </div>
        </main>
    );
} 