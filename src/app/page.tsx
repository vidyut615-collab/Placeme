import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-[1200px] flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="font-heading font-semibold tracking-tight text-xl text-foreground">
              PlacementManagement
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="default" className="font-sans px-6" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto max-w-[1200px] px-4 py-24 md:py-32 flex flex-col md:flex-row gap-12 items-center">
          
          <div className="flex-1 flex flex-col gap-6 text-center md:text-left">
            <h1 className="font-heading text-5xl md:text-6xl font-semibold leading-[1.1] tracking-tight text-foreground">
              The better way to manage campus placements.
            </h1>
            <p className="font-sans text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto md:mx-0">
              A powerful, configurable platform to streamline job drives, track applications, and handle placement policies—all from one unified interface.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
              <Button size="lg" className="font-sans text-base" asChild>
                <Link href="/login">Get started</Link>
              </Button>
              <Button size="lg" variant="ghost" className="font-sans text-base">
                Read documentation
              </Button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md md:max-w-none">
            <Card className="w-full aspect-[4/3] bg-white p-2">
              {/* Mockup of a scheduling/dashboard widget */}
              <CardContent className="p-4 flex flex-col gap-4 h-full border border-border/50 rounded-lg bg-zinc-50/50">
                <div className="h-8 flex items-center border-b border-border/50 pb-4 mb-2">
                  <div className="font-heading font-semibold text-sm">Upcoming Drives</div>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white rounded-md border border-border/40 shadow-sm-4">
                    <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                      Co
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="h-3 w-24 bg-foreground/80 rounded-full"></div>
                      <div className="h-2 w-16 bg-muted-foreground/50 rounded-full"></div>
                    </div>
                    <div className="h-6 w-16 bg-accent/10 rounded-full"></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
        </section>

        {/* Features Section */}
        <section className="container mx-auto max-w-[1200px] px-4 py-24 border-t border-border">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card">
              <CardContent className="p-8 flex flex-col gap-4">
                <div className="h-10 w-10 bg-accent/10 text-accent rounded-full flex items-center justify-center font-heading font-semibold">1</div>
                <h3 className="font-heading text-2xl font-semibold">Configurable Policies</h3>
                <p className="font-sans text-muted-foreground">
                  Define complex eligibility, attempt limits, and offer rules without writing a single line of code.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-8 flex flex-col gap-4">
                <div className="h-10 w-10 bg-accent/10 text-accent rounded-full flex items-center justify-center font-heading font-semibold">2</div>
                <h3 className="font-heading text-2xl font-semibold">Real-time Analytics</h3>
                <p className="font-sans text-muted-foreground">
                  Track student progress, monitor upcoming interviews, and evaluate placement success instantly.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-8 flex flex-col gap-4">
                <div className="h-10 w-10 bg-accent/10 text-accent rounded-full flex items-center justify-center font-heading font-semibold">3</div>
                <h3 className="font-heading text-2xl font-semibold">Unified Dashboards</h3>
                <p className="font-sans text-muted-foreground">
                  Role-specific views for students, college administrators, and recruiters keep everyone aligned.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
