import Link from "next/link";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onScanClick?: () => void;
}

export function Navbar({ onScanClick }: NavbarProps) {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <svg
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            aria-hidden="true"
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
          <span className="text-[19px] font-bold tracking-tight text-ink">
            T1<span className="text-violet-500">-</span>Scan
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="text-sm font-semibold text-ink-soft hover:text-ink transition-colors px-3 py-2"
          >
            Pricing
          </Link>
          <Button
            onClick={onScanClick}
            variant="dark"
            className="px-5 py-2.5 text-sm"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}

