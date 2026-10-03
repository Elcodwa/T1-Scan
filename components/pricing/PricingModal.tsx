"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { PricingTable, PlanId } from "./PricingTable";
import { useLanguage } from "@/lib/i18n";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (planId: PlanId) => void;
}

export function PricingModal({ isOpen, onClose, onSelectPlan }: PricingModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-night/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-4xl my-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          aria-label={t.modal.closeLabel}
          title={t.modal.closeLabel}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 text-ink dark:text-slate-100 shadow-md backdrop-blur-md transition-all hover:bg-white dark:hover:bg-white/20 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
        >
          <X className="h-5 w-5" />
        </button>

        <PricingTable
          onSelect={(planId) => {
            onSelectPlan?.(planId);
          }}
        />
      </div>
    </div>
  );
}
