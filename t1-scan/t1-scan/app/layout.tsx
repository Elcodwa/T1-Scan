import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#0B0A16",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
