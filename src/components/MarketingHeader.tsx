import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-paper/80 backdrop-blur-md border-b border-silver">
      <div className="max-w-[1200px] mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-ink rounded-sm" />
          <Link href="/" className="font-heading font-semibold tracking-wide text-ink text-lg">
            Placeme
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/features" className="font-sans text-sm font-medium text-graphite hover:text-ink transition-colors">Features</Link>
          <Link href="/pricing" className="font-sans text-sm font-medium text-graphite hover:text-ink transition-colors">Pricing</Link>
          <Link href="/about" className="font-sans text-sm font-medium text-graphite hover:text-ink transition-colors">About</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className={cn(
              buttonVariants({ variant: "ghost" }), 
              "hidden md:flex font-sans font-medium text-sm text-graphite hover:bg-silver/50 rounded-full h-10 px-6"
            )}
          >
            Login
          </Link>
          <Link 
            href="/login" 
            className={cn(
              buttonVariants({ variant: "default" }), 
              "font-sans font-medium text-sm bg-ink hover:bg-graphite text-white rounded-full h-10 px-6 shadow-sm-2"
            )}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
