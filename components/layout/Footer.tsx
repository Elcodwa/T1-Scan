"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { socialLinks } from "./socialIcons";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[rgba(31,27,58,0.08)] dark:border-white/10 bg-white/80 dark:bg-[#0B0A16]/90 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center sm:items-start gap-1">
            <Link href="/" className="flex items-center gap-2 group">
              <svg
                width="22"
                height="22"
                viewBox="0 0 26 26"
                fill="none"
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:scale-110"
              >
                <circle cx="10" cy="13" r="7.5" stroke="#6C5CE7" strokeWidth="1.6" />
                <circle cx="16" cy="13" r="7.5" stroke="#6C5CE7" strokeWidth="1.6" opacity="0.55" />
              </svg>
              <span className="text-[17px] font-bold tracking-tight text-ink dark:text-white">
                T1<span className="text-violet-500">-</span>Scan
              </span>
            </Link>
            <p className="text-xs text-ink-muted dark:text-slate-400">
              {t.footer.description}
            </p>
          </div>

          {/* Social Media Links */}
          <div className="flex items-center gap-2.5" role="group" aria-label={t.footer.followUs}>
            {socialLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.name}
                title={item.name}
                className={`flex h-9 w-9 items-center justify-center rounded-full border border-violet-100 dark:border-white/10 bg-violet-50/50 dark:bg-white/[0.04] text-ink-muted dark:text-slate-400 transition-all duration-200 hover:scale-110 shadow-sm ${item.hover}`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d={item.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-[rgba(31,27,58,0.06)] dark:border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted dark:text-slate-500">
          <p>© {new Date().getFullYear()} T1-Scan. {t.footer.rights}</p>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="hover:text-ink dark:hover:text-slate-300 transition-colors">
              {t.navbar.pricing}
            </Link>
            <span>•</span>
            <span className="hover:text-ink dark:hover:text-slate-300 cursor-pointer transition-colors">
              {t.footer.privacy}
            </span>
            <span>•</span>
            <span className="hover:text-ink dark:hover:text-slate-300 cursor-pointer transition-colors">
              {t.footer.terms}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

