"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF7] dark:bg-[#0B0A16] px-4 text-center transition-colors duration-300">
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-8 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-md w-full">
        <h1 className="text-6xl font-black text-ink dark:text-white">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-ink dark:text-white">{t.notFound.title}</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {t.notFound.description}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="primary" className="w-full">{t.notFound.home}</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="dark" className="w-full">{t.notFound.pricing}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

