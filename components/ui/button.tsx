import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "dark" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /**
   * When set the button renders as a Next.js <Link> (an <a>) with the same
   * styling, instead of a <button>. Used by the "Scan my face" CTAs so they
   * navigate to the analysis workspace.
   */
  href?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-[0_10px_24px_rgba(108,92,231,0.35)] hover:shadow-[0_14px_30px_rgba(108,92,231,0.45)] hover:-translate-y-0.5",
  dark: "bg-[#0B0A16] dark:bg-white text-white dark:text-[#0B0A16] hover:bg-[#17152b] dark:hover:bg-slate-100 shadow-sm",
  ghost:
    "bg-white dark:bg-white/[0.06] text-ink dark:text-slate-200 border border-[rgba(31,27,58,0.12)] dark:border-white/15 hover:border-[rgba(31,27,58,0.25)] dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-white/[0.1]",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", href, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold transition-all duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500",
      variantClasses[variant],
      className
    );

    if (href) {
      return (
        <Link href={href} className={classes}>
          {props.children}
        </Link>
      );
    }

    return <button ref={ref} className={classes} {...props} />;
  }
);
Button.displayName = "Button";

export { Button };

