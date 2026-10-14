import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  AlertTriangle,
  ScanSearch,
  RotateCcw,
  Info,
} from "lucide-react";
import {
  analyzeText,
  validateInput,
  MAX_CHARS,
  type AnalysisResult,
  type RiskLevel,
} from "@/lib/analyzer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrustHire AI — Spot Suspicious Job Offers" },
      {
        name: "description",
        content:
          "TrustHire AI helps students check job and internship offers for common scam warning signs using transparent, explainable rules.",
      },
      { property: "og:title", content: "TrustHire AI — Spot Suspicious Job Offers" },
      {
        property: "og:description",
        content:
          "Paste a job offer or recruiter message and get an explainable risk assessment with warning signs and safety tips.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const LEVEL_META: Record<
  RiskLevel,
  { label: string; icon: typeof ShieldCheck; badge: string; bar: string; panel: string }
> = {
  low: {
    label: "Low Risk",
    icon: ShieldCheck,
    badge: "bg-safe text-safe-foreground",
    bar: "bg-safe-foreground",
    panel: "border-safe",
  },
  medium: {
    label: "Medium Risk",
    icon: ShieldQuestion,
    badge: "bg-caution text-caution-foreground",
    bar: "bg-caution-foreground",
    panel: "border-caution",
  },
  high: {
    label: "High Risk",
    icon: ShieldAlert,
    badge: "bg-danger text-danger-foreground",
    bar: "bg-danger-foreground",
    panel: "border-danger",
  },
};

function Index() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = () => {
    const validationError = validateInput(text);
    if (validationError) {
      setError(validationError);
      setResult(null);
      return;
    }
    setError(null);
    setResult(analyzeText(text));
  };

  const handleReset = () => {
    setText("");
    setError(null);
    setResult(null);
  };

  const meta = result ? LEVEL_META[result.level] : null;
  const LevelIcon = meta?.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">TrustHire AI</h1>
            <p className="text-xs text-muted-foreground">Spot suspicious job offers before they spot you</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Intro */}
        <section className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Is that job offer real?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Paste a job description or recruiter message below. TrustHire AI checks it against
            known scam warning signs and explains exactly what it found — no black box.
          </p>
        </section>

        {/* Input card */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <label htmlFor="job-text" className="mb-2 block text-sm font-semibold text-foreground">
            Job description or recruiter message
          </label>
          <textarea
            id="job-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste the full message here — e.g. the email, WhatsApp message, or job posting you received…"
            rows={8}
            maxLength={MAX_CHARS + 1000}
            className="w-full resize-y rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{text.trim() ? `${text.trim().split(/\s+/).length} words` : "Minimum 20 words"}</span>
            <span>{text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}</span>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-xl border border-danger bg-danger px-3 py-2 text-sm text-danger-foreground"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleAnalyze}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ScanSearch className="h-4 w-4" />
              Analyze
            </button>
            {(result || text) && (
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent"
              >
                <RotateCcw className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </section>

        {/* Results */}
        {result && meta && LevelIcon && (
          <section aria-live="polite" className={`mt-6 rounded-2xl border-2 bg-card p-4 shadow-sm sm:p-6 ${meta.panel}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${meta.badge}`}>
                  <LevelIcon className="h-4 w-4" />
                  {meta.label}
                </span>
                <span className="text-sm text-muted-foreground">Risk score: {result.score}/100</span>
              </div>
            </div>

            {/* Score bar */}
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${meta.bar}`}
                style={{ width: `${Math.max(result.score, 4)}%` }}
              />
            </div>

            {/* Warning signs */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
                {result.signs.length > 0
                  ? `Warning signs detected (${result.signs.length})`
                  : "No warning signs detected"}
              </h3>
              {result.signs.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  This message didn't trigger any of our warning rules. That doesn't guarantee it's
                  genuine — always verify the employer independently.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {result.signs.map((sign) => (
                    <li key={sign.id} className="rounded-xl border border-border bg-background p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-caution-foreground" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{sign.title}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">{sign.reason}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {sign.matches.map((m, i) => (
                              <code
                                key={i}
                                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                “{m.length > 60 ? m.slice(0, 60) + "…" : m}”
                              </code>
                            ))}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recommendations */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
                Safety recommendations
              </h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-foreground">
                {result.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 flex items-start gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <strong className="text-foreground">Disclaimer:</strong> This is a rule-based risk
                assessment, not proof — and no AI model is connected. The score only reflects the
                specific warning rules that matched your text. It can miss new or subtle scam
                tactics (low score ≠ guaranteed genuine) and can flag honest messages that happen
                to use flagged phrases (high score ≠ proven fraud). It also cannot verify that a
                company or recruiter actually exists. Always verify the employer through official
                channels before sharing personal information or money.
              </p>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Paste the message",
              body: "Copy the job posting, email, or chat message you received.",
            },
            {
              title: "We check the signs",
              body: "Transparent rules look for fee requests, urgency tactics, free email domains, and more.",
            },
            {
              title: "You decide safely",
              body: "Get a risk level with clear reasons and practical next steps.",
            },
          ].map((step, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Step {i + 1}</p>
              <h3 className="mt-1 text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </section>

        <footer className="mt-10 border-t border-border pt-4 pb-8 text-center text-xs text-muted-foreground">
          TrustHire AI is an educational tool for students. It uses explainable warning rules — not
          a machine-learning model — and never stores the text you paste.
        </footer>
      </main>
    </div>
  );
}
