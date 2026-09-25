import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "dark" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-[0_10px_24px_rgba(108,92,231,0.35)] hover:shadow-[0_14px_30px_rgba(108,92,231,0.45)] hover:-translate-y-0.5",
  dark: "bg-[#0B0A16] text-white hover:bg-[#17152b]",
  ghost:
    "bg-white text-ink border border-[rgba(31,27,58,0.12)] hover:border-[rgba(31,27,58,0.25)]",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold transition-all duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
