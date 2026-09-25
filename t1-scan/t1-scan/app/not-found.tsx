import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF7] px-4 text-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl max-w-md w-full">
        <h1 className="text-6xl font-black text-ink">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-ink">Page Not Found</h2>
        <p className="mt-2 text-slate-600">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="primary" className="w-full">Go to Home</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="dark" className="w-full">View Pricing</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

