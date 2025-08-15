export default function TermsPage() {
    return (
        <main className="min-h-screen hero-gradient">
            <section className="py-6 flex flex-col items-center gap-6">
                <div className="w-full max-w-3xl px-4">
                    <h1 className="text-2xl font-bold mb-3">Terms of Service</h1>
                    <p className="opacity-80 mb-2">ProP2P is a classifieds board for peer‑to‑peer crypto deals. We do not escrow funds or act as an intermediary.</p>
                    <ul className="list-disc pl-5 opacity-80 space-y-1">
                        <li>Users are solely responsible for their actions and compliance with local laws.</li>
                        <li>Do not post illegal content, spam, or fraudulent offers.</li>
                        <li>Platform may remove content that violates rules and suspend accounts involved in abuse.</li>
                    </ul>
                </div>
            </section>
        </main>
    );
} 