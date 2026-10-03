import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "T1-Scan — Precision Facial Analysis",
  description:
    "Upload your photo and get a complete clinical-grade analysis with harmony score, facial proportions, traits, and anatomical landmark breakdowns.",
  keywords: [
    "facial analysis",
    "golden ratio",
    "facial symmetry",
    "face proportions",
    "facial aesthetics",
    "dimorphism score",
  ],
  authors: [{ name: "T1-Scan" }],
  openGraph: {
    title: "T1-Scan — Precision Facial Analysis",
    description:
      "Upload your photo and get a complete analysis with harmony score, facial proportions, and structural insights.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "T1-Scan — Precision Facial Analysis",
    description:
      "Clinical-grade facial analysis and proportion scoring in seconds.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B0A16",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('t1_theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (storedTheme === 'dark' || (!storedTheme && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  var storedLang = localStorage.getItem('t1_lang');
                  if (storedLang) {
                    document.documentElement.lang = storedLang;
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-white dark:bg-[#0B0A16] text-ink dark:text-[#f1f0f7] transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

