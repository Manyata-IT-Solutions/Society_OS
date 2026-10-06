import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: 'Community OS | Enterprise Society & Facility Platform',
  description: 'Enterprise Residential Community ERP, Facility Management & Multi-Society Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="community-os-theme"
          dangerouslySetInnerHTML={{
            __html: `
          (() => {
            try {
              const storedTheme = localStorage.getItem('community_os_theme');
              const root = document.documentElement;
              root.classList.remove('light', 'dark');
              if (storedTheme === 'light' || storedTheme === 'dark') {
                root.dataset.theme = storedTheme;
                root.classList.add(storedTheme);
              } else {
                delete root.dataset.theme;
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  root.classList.add('dark');
                } else {
                  root.classList.add('light');
                }
              }
            } catch {
              // Keep the server-rendered system theme when storage is unavailable.
            }
          })();
        `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
