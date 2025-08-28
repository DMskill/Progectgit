import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProP2P',
  description: 'P2P listings for crypto, goods and services'
};

const ThemeScript = (
  <script
    dangerouslySetInnerHTML={{
      __html: `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var isDark = t ? t === 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (isDark) { root.classList.add('dark'); root.classList.remove('light'); }
    else { root.classList.add('light'); root.classList.remove('dark'); }
  } catch (e) {}
})();
`}}
  />
);

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>{ThemeScript}</head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
