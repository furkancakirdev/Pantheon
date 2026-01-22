import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
            <nav className="space-y-2">
              <a href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-emerald-400">
                <span>🏠</span> Dashboard
              </a>
              <a href="/stocks" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                <span>📈</span> Hisseler
              </a>
              <a href="/funds" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                <span>💰</span> Fonlar
              </a>
              <a href="/wonderkid" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                <span>⭐</span> Wonderkid
              </a>
              <a href="/sentiment" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                <span>🐦</span> Sentiment
              </a>
              <a href="/reports" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                <span>📋</span> Raporlar
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
