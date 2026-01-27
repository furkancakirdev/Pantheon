import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InvestorAgent | Yatırım Analiz Platformu",
  description: "BIST, TEFAS, ABD Borsaları için hibrit yatırım analiz ajanı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-slate-950 text-slate-100`}>
        <div className="min-h-screen flex">
          {/* Sidebar */}
          <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 hidden md:block">
            <div className="flex items-center gap-2 mb-8">
              <span className="text-2xl">📊</span>
              <h1 className="text-xl font-bold text-emerald-400">InvestorAgent</h1>
            </div>
            <nav className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Genel</div>
              <a href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-emerald-400">
                <span>🏠</span> Dashboard
              </a>
              <a href="/council" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition text-purple-400 font-bold">
                <span>🏛️</span> Grand Council
              </a>

              <div className="px-3 py-2 mt-4 text-xs font-semibold text-slate-500 uppercase">Analiz</div>
              <a href="/stocks" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                <span>📈</span> Hisseler & Atlas
              </a>
              <a href="/orion" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                <span>⚡</span> Orion (Teknik)
              </a>
              <a href="/phoenix" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                <span>🔥</span> Phoenix (Strateji)
              </a>

              <div className="px-3 py-2 mt-4 text-xs font-semibold text-slate-500 uppercase">Makro & Risk</div>
              <a href="/aether" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                <span>🌍</span> Aether (Makro)
              </a>
              <a href="/chiron" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                <span>🛡️</span> Chiron (Risk)
              </a>

              <div className="px-3 py-2 mt-4 text-xs font-semibold text-slate-500 uppercase">Diğer</div>
              <a href="/wonderkid" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                <span>⭐</span> Wonderkid (Sektör)
              </a>
              <a href="/sentiment" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                <span>🐦</span> Sentiment (Hermes)
              </a>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
