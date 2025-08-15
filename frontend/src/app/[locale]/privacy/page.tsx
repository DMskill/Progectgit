export default function PrivacyPage() {
    return (
        <main className="min-h-screen hero-gradient">
            <section className="py-6 flex flex-col items-center gap-6">
                <div className="w-full max-w-3xl px-4">
                    <h1 className="text-2xl font-bold mb-3">Privacy Policy</h1>
                    <p className="opacity-80 mb-2">We collect only the data necessary to operate the service (account email and basic profile). We do not sell personal data.</p>
                    <ul className="list-disc pl-5 opacity-80 space-y-1">
                        <li>Your email is used for authentication and notifications.</li>
                        <li>You may request deletion of your account via support.</li>
                        <li>Cookies/localStorage may be used to keep your session.</li>
                    </ul>
                </div>
            </section>
        </main>
    );
} 