import { ReactNode } from "react";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { LocaleLangUpdater } from "components/locale-lang-updater";
import { AuthProtection } from "components/auth-protection";

// Root layout - must include <html> and <body> tags per Next.js requirements
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="sk" className={GeistSans.variable} suppressHydrationWarning>
      <body className="bg-neutral-50 text-black selection:bg-teal-300 dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white" suppressHydrationWarning>
        <LocaleLangUpdater />
        <AuthProtection>
          {children}
        </AuthProtection>
      </body>
    </html>
  );
}
