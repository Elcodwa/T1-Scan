export function Footer() {
  return (
    <footer className="border-t border-[rgba(31,27,58,0.08)] bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-ink-muted sm:flex-row lg:px-10">
        <span className="font-semibold text-ink-soft">T1-Scan</span>
        <p>© {new Date().getFullYear()} T1-Scan. All rights reserved.</p>
      </div>
    </footer>
  );
}
