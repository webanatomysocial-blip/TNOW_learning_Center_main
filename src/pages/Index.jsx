import { ShieldCheck } from "@phosphor-icons/react";
import { useDocumentHead } from "@/lib/use-document-head";

export function Index() {
  useDocumentHead({ meta: [{ title: "ToggleNow Experience Center" }] });

  return (
    <main className="min-h-dvh bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center mb-8">
          <img src="/logo.png" alt="ToggleNow" className="h-8 w-auto object-contain" />
        </div>

        <div className="rounded-2xl border border-border bg-background p-8 shadow-soft">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-6" weight="fill" />
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight mb-2">
            This is a private experience
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Access to the ToggleNow Experience Center is by invitation only. Check your email for
            your personal sign-in link.
          </p>
        </div>

        <p className="mt-6 text-xs text-caption">
          © {new Date().getFullYear()} ToggleNow · SAP Security & Governance
        </p>
      </div>
    </main>
  );
}
