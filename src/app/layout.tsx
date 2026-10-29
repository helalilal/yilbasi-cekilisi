import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/locale";
import { getMessages } from "@/lib/i18n";
import LangSwitch from "@/components/LangSwitch";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

export async function generateMetadata(): Promise<Metadata> {
  const t = getMessages(await getLocale());
  return { title: t.common.appName, description: t.home.heroText };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = getMessages(locale);
  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-dvh">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4">
          <header className="flex items-center justify-between py-5">
            <Link href="/" className="text-lg font-bold">
              🎄 {t.common.appName}
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/fikir" className="hidden text-sm text-muted hover:text-ink sm:inline">
                {t.ideas.navLink}
              </Link>
              <LangSwitch locale={locale} />
            </div>
          </header>
          <main className="flex-1 pb-10">{children}</main>
          <footer className="py-6 text-center text-xs text-muted">{t.common.footer}</footer>
        </div>
      </body>
    </html>
  );
}
