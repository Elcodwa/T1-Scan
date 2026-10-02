"use client";

import Link from "next/link";
import { Sun, Moon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n";
import { useState, useEffect } from "react";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="relative z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2 group">
          <svg
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:scale-110"
          >
            <circle
              cx="10"
              cy="13"
              r="7.5"
              stroke="#6C5CE7"
              strokeWidth="1.6"
            />
            <circle
              cx="16"
              cy="13"
              r="7.5"
              stroke="#6C5CE7"
              strokeWidth="1.6"
              opacity="0.55"
            />
          </svg>
          <span className="text-[19px] font-bold tracking-tight text-ink dark:text-white transition-colors">
            T1<span className="text-violet-500">-</span>Scan
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switch Button */}
          <button
            onClick={toggleLanguage}
            aria-label={t.navbar.switchLanguage}
            title={t.navbar.switchLanguage}
            className="flex items-center gap-1.5 rounded-full border border-violet-200/70 dark:border-white/10 bg-white/80 dark:bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-ink-soft dark:text-slate-200 shadow-sm backdrop-blur-md transition-all hover:bg-violet-50 dark:hover:bg-white/[0.1] hover:border-violet-300"
          >
            <Globe className="h-3.5 w-3.5 text-violet-500" />
            <span className="uppercase font-bold tracking-wider">{language}</span>
            <span className="text-[10px] text-ink-muted dark:text-slate-400">
              {language === "en" ? "ES" : "EN"}
            </span>
          </button>

          {/* Theme Toggle (Dark / Light) Button */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? t.navbar.lightMode : t.navbar.darkMode}
            title={theme === "dark" ? t.navbar.lightMode : t.navbar.darkMode}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-200/70 dark:border-white/10 bg-white/80 dark:bg-white/[0.06] text-ink-soft dark:text-slate-200 shadow-sm backdrop-blur-md transition-all hover:bg-violet-50 dark:hover:bg-white/[0.1] hover:border-violet-300"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-violet-600 dark:text-violet-400 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          <Link
            href="/pricing"
            className="hidden sm:inline-block text-sm font-semibold text-ink-soft dark:text-slate-300 hover:text-ink dark:hover:text-white transition-colors px-3 py-2"
          >
            {t.navbar.pricing}
          </Link>

          <Button
            href="/analysis"
            variant="dark"
            className="px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm"
          >
            {t.navbar.getStarted}
          </Button>
        </div>
      </div>
    </header>
  );
}


