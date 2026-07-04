import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  PoundSterling,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  UserPlus,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Chatbot } from "@/components/Chatbot";
import { HeroReceipt } from "@/components/HeroReceipt";
import { Navbar } from "@/components/Navbar";
import { openAuthDialog, useDemoAuth } from "@/lib/useDemoAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PayoutBridge — Restore real turnover in Xero" },
      {
        name: "description",
        content:
          "Marketplace payouts hide your real revenue. PayoutBridge turns opaque settlement CSVs into Xero-native gross-up accounting with a zero-balance clearing account.",
      },
      { property: "og:title", content: "PayoutBridge" },
      {
        property: "og:description",
        content:
          "Your bank feed has been lying about your turnover. Fix reporting with human-approved, auditable Xero postings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useDemoAuth();
  return (
    <>
      <Navbar />
      {user ? <Dashboard user={user} /> : <SignedOutHome />}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Signed-in dashboard                                                        */
/* -------------------------------------------------------------------------- */

const revenueSeries = [
  { month: "Jan", reported: 8420, real: 12980 },
  { month: "Feb", reported: 9110, real: 13840 },
  { month: "Mar", reported: 10240, real: 15720 },
  { month: "Apr", reported: 9860, real: 15020 },
  { month: "May", reported: 11430, real: 17640 },
  { month: "Jun", reported: 12210, real: 18930 },
];

const feeBreakdown = [
  { name: "Commission", value: 4459 },
  { name: "Prepayment fees", value: 471 },
  { name: "Refund fees", value: 118 },
];

const payoutsPerWeek = [
  { week: "W22", payouts: 3 },
  { week: "W23", payouts: 5 },
  { week: "W24", payouts: 4 },
  { week: "W25", payouts: 6 },
  { week: "W26", payouts: 7 },
  { week: "W27", payouts: 5 },
];

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#ec4899"];
const AREA_REAL = "#3b82f6";
const AREA_REPORTED = "#94a3b8";

function Dashboard({ user }: { user: string }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Welcome back, <span className="text-primary/80">{user}</span>
          </h1>
        </div>
        <Link
          to="/app"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Upload className="size-4" aria-hidden />
          Upload payout
        </Link>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Real turnover (MTD)"
          value="£18,930"
          delta="+54.9% vs reported"
          tone="primary"
          icon={<PoundSterling className="size-5" />}
        />
        <KpiCard
          label="Fees recovered"
          value="£5,048"
          delta="+£812 vs last month"
          tone="foreground"
          icon={<TrendingUp className="size-5" />}
        />
        <KpiCard
          label="Payouts reconciled"
          value="30"
          delta="6 this week"
          tone="foreground"
          icon={<CheckCircle2 className="size-5" />}
        />
        <KpiCard
          label="Clearing balance"
          value="£0.00"
          delta="Verified · zero-balance"
          tone="success"
          icon={<ShieldCheck className="size-5" />}
        />
      </section>

      {/* Charts row */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Reported vs real turnover"
          subtitle="Last 6 months"
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueSeries} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="realFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AREA_REAL} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={AREA_REAL} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="reportedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AREA_REPORTED} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={AREA_REPORTED} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--foreground)",
                }}
                formatter={(v: number) => `£${v.toLocaleString()}`}
              />
              <Area
                type="monotone"
                dataKey="reported"
                stroke={AREA_REPORTED}
                fill="url(#reportedFill)"
                strokeWidth={2}
                name="Reported"
              />
              <Area
                type="monotone"
                dataKey="real"
                stroke={AREA_REAL}
                fill="url(#realFill)"
                strokeWidth={2}
                name="Real"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fees this month" subtitle="Where £5,048 went">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={feeBreakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                stroke="var(--card)"
              >
                {feeBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--foreground)",
                }}
                formatter={(v: number) => `£${v.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {feeBreakdown.map((f, i) => (
              <li key={f.name} className="flex items-center gap-2">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  aria-hidden
                />
                <span className="flex-1">{f.name}</span>
                <span className="tabular-nums text-foreground">£{f.value.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </section>

      {/* Bar chart + activity row */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Payouts reconciled per week" subtitle="Last 6 weeks">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={payoutsPerWeek} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" stroke="var(--muted-foreground)" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--foreground)",
                }}
              />
              <Bar dataKey="payouts" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Recent activity
              </h3>
            </div>
            <Link
              to="/app"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            <ActivityRow
              status="verified"
              title="Payout 2026-07-02"
              detail="Amazon UK · £1,340 gross · £847 net"
              time="2h ago"
            />
            <ActivityRow
              status="verified"
              title="Payout 2026-06-28"
              detail="Etsy · £980 gross · £642 net"
              time="Yesterday"
            />
            <ActivityRow
              status="idempotent"
              title="Duplicate blocked"
              detail="settlement-jun-24.csv already posted"
              time="Jun 24"
            />
            <ActivityRow
              status="verified"
              title="Payout 2026-06-20"
              detail="Amazon UK · £2,110 gross · £1,368 net"
              time="Jun 20"
            />
          </ul>
        </div>
      </section>


      <footer className="pt-2 text-center text-xs text-muted-foreground">
        Signed in as {user} · demo session · figures are illustrative
      </footer>
      <Chatbot />
    </main>
  );
}

function KpiCard({
  label,
  value,
  delta,
  tone,
  icon,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "primary" | "foreground" | "success";
  icon: React.ReactNode;
}) {
  const accents =
    tone === "primary"
      ? { bar: "border-blue-500", bg: "bg-blue-500/15", text: "text-blue-500" }
      : tone === "success"
        ? { bar: "border-emerald-500", bg: "bg-emerald-500/15", text: "text-emerald-500" }
        : { bar: "border-slate-500", bg: "bg-slate-500/15", text: "text-slate-500" };
  return (
    <div className={`rounded-2xl border border-border border-t-4 bg-card p-5 ${accents.bar}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <span className={`flex size-8 items-center justify-center rounded-lg ${accents.bg} ${accents.text}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight tabular-nums">{value}</p>
      <p className={`mt-1 text-xs font-medium ${accents.text}`}>{delta}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className ?? ""}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        {subtitle ? <p className="text-xs text-muted-foreground/80">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function ActivityRow({
  status,
  title,
  detail,
  time,
}: {
  status: "verified" | "idempotent";
  title: string;
  detail: string;
  time: string;
}) {
  const badge =
    status === "verified"
      ? { label: "Verified", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", indicator: "bg-emerald-500" }
      : { label: "Idempotent", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30", indicator: "bg-amber-500" };
  return (
    <li className="flex items-center gap-3 border-l-2 border-border py-3 pl-3">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.cls}`}
      >
        <span className={`inline-block size-1.5 rounded-full ${badge.indicator}`} aria-hidden />
        {badge.label}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      <span className="whitespace-nowrap text-xs text-muted-foreground">{time}</span>
    </li>
  );
}


/* -------------------------------------------------------------------------- */
/* Signed-out marketing page                                                  */
/* -------------------------------------------------------------------------- */

function SignedOutHome() {
  return (
    <main className="flex min-h-screen w-full flex-col">
      {/* Hero */}
      <section
        className="relative isolate overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-14"
        style={{ backgroundSize: "200% 200%" }}
      >
        <div
          className="absolute -inset-[100%] animate-gradient-shift bg-gradient-to-br from-red-600 from-40% to-blue-600 to-60%"
          style={{ backgroundSize: "200% 200%" }}
          aria-hidden="true"
        />
        <div
          className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/25 blur-3xl animate-glow-pulse"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl animate-glow-pulse"
          style={{ animationDelay: "2s" }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
          {/* left: copy */}
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
              <Sparkles className="size-3.5 text-amber-300" aria-hidden />
              Human-in-the-loop · Xero-native · Auditable
            </span>

            <h1
              className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.75rem]"
            >
              Your{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10">bank feed</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-1 h-[6px] rounded-full bg-gradient-to-r from-sky-300/0 via-sky-200 to-sky-300/0 blur-[2px]"
                />
                <span
                  aria-hidden
                  className="absolute inset-x-1 -bottom-0.5 h-[2px] rounded-full bg-sky-100"
                />
              </span>{" "}
              has been{" "}
              <span className="relative inline-block whitespace-nowrap">
                <em className="font-display not-italic text-rose-100 [font-style:italic]">lying</em>
                <svg
                  aria-hidden
                  viewBox="0 0 120 8"
                  preserveAspectRatio="none"
                  className="absolute inset-x-0 -bottom-2 h-2.5 w-full text-rose-200/90"
                >
                  <path
                    d="M2 5 Q 15 1, 30 5 T 60 5 T 90 5 T 118 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              about your turnover.
            </h1>

            <p className="max-w-xl text-pretty text-base text-white/85 sm:text-lg">
              When a marketplace deducts commission and fees before wiring your
              payout, Xero only records the net deposit. PayoutBridge restores
              the real gross revenue, books the fees, and proves it with a
              live zero-balance clearing account — every write approved by you.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openAuthDialog("signup")}
                className="group inline-flex items-center gap-2 rounded-full bg-white py-3 pl-6 pr-3 text-sm font-semibold text-slate-900 shadow-xl shadow-blue-950/30 ring-1 ring-white/40 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
              >
                Create your account
                <span className="grid size-7 place-items-center rounded-full bg-slate-900/90 text-white transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </button>
              <button
                type="button"
                onClick={() => openAuthDialog("login")}
                className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Log in
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1 text-sm font-medium text-white/85 underline-offset-4 hover:text-white hover:underline"
              >
                See how it works
                <ArrowRight className="size-3.5" aria-hidden />
              </a>
            </div>

            <p className="text-xs text-white/75">
              Free while in beta · no card required · takes under a minute.
            </p>
          </div>

          {/* right: product proof */}
          <div className="flex justify-center lg:justify-end">
            <div className="rotate-[-1.5deg] transition-transform hover:rotate-0">
              <HeroReceipt />
            </div>
          </div>
        </div>
      </section>

      {/* fade bridge between hero gradient and page background */}
      <div
        aria-hidden
        className="-mt-8 h-16 w-full bg-gradient-to-b from-blue-600/40 via-background/60 to-background"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 pb-20 sm:px-6">
        {/* Why sign up — asymmetric bento */}
        <section aria-labelledby="why-heading" className="flex flex-col gap-8">
          <div className="max-w-2xl">
            <Eyebrow>Product</Eyebrow>
            <h2
              id="why-heading"
              className="mt-4 text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl"
            >
              Why teams sign up for{" "}
              <span className="font-display italic text-primary">PayoutBridge</span>
            </h2>
            <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
              A free account unlocks the full workspace: dashboard, saved
              audit trails, and one-click posting to Xero.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2">
            {/* wide feature */}
            <div className="md:col-span-4 md:row-span-2 group relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <TrendingUp className="size-5 text-primary" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">See your real turnover</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A live dashboard shows reported vs real revenue and fees
                    recovered — updated on every approval.
                  </p>
                </div>
              </div>

              {/* mini bar-comparison visual */}
              <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="flex items-end justify-between gap-3">
                  <MiniBar label="Reported" value={0.42} tone="muted" amount="£9.1k" />
                  <MiniBar label="Real" value={1} tone="primary" amount="£15.7k" />
                  <MiniBar label="Recovered" value={0.32} tone="success" amount="+£6.6k" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <FileText className="size-5 text-emerald-400" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-base font-semibold">Keep every audit trail</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Signed-in workspaces save every proposal, Xero ID, and
                timestamp so your accountant never has to ask twice.
              </p>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                <ShieldCheck className="size-5 text-violet-400" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-base font-semibold">Post safely to Xero</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect once and PayoutBridge is idempotent by file hash —
                re-uploads never double-post.
              </p>
            </div>
          </div>
        </section>

        {/* Attraction panel — £493 stat as centerpiece */}
        <section
          aria-labelledby="problem-heading"
          className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/60 p-1.5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/5"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-red-500/15 blur-3xl"
          />
          <div className="relative rounded-[calc(2rem-0.375rem)] border border-white/5 bg-gradient-to-br from-card via-card to-background/80 p-6 sm:p-12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
          <div className="relative grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-5">
              <Eyebrow tone="rose">The problem</Eyebrow>
              <h2
                id="problem-heading"
                className="text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl"
              >
                Stop losing revenue{" "}
                <span className="font-display italic text-rose-400">in plain sight.</span>
              </h2>
              <p className="text-pretty text-base text-muted-foreground sm:text-lg">
                Marketplace payouts arrive net of commission, fees, and
                refunds — so Xero records a fraction of your actual turnover.
                PayoutBridge rebuilds the full picture with three Xero-native
                writes and a zero-balance clearing account.
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  "Recover hidden commission and fee expenses.",
                  "Keep a live, auditable trail for every payout.",
                  "Post once — re-uploading the same file never double-posts.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/25">
                      <CheckCircle2
                        className="size-3 text-primary"
                        aria-hidden
                        strokeWidth={2.5}
                      />
                    </span>
                    <span className="text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Double-bezel stat card */}
            <div className="relative rounded-[1.75rem] bg-gradient-to-br from-white/10 to-white/[0.02] p-1.5 ring-1 ring-white/10 shadow-[0_30px_80px_-40px_rgba(244,63,94,0.4)]">
              <div className="relative rounded-[calc(1.75rem-0.375rem)] border border-white/5 bg-background/80 p-8 text-center backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-rose-300">
                  Typical understatement
                </span>
                <p
                  className="mt-5 bg-gradient-to-br from-rose-200 via-rose-400 to-red-600 bg-clip-text pb-2 font-display text-8xl font-normal leading-none tracking-tight text-transparent tabular-nums sm:text-[9rem]"
                  style={{
                    animation:
                      "reveal-scale 800ms cubic-bezier(0.16, 1, 0.3, 1) both",
                  }}
                >
                  £493
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  per <span className="font-mono tabular-nums text-foreground/80">£1,340</span> marketplace payout
                </p>
                <button
                  type="button"
                  onClick={() => openAuthDialog("signup")}
                  className="group mt-7 inline-flex items-center gap-2 rounded-full bg-white py-2.5 pl-5 pr-2 text-sm font-semibold text-slate-900 shadow-lg shadow-black/30 ring-1 ring-white/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Find yours
                  <span className="grid size-7 place-items-center rounded-full bg-slate-900 text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px]">
                    <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                </button>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* How it works — timeline rail */}
        <section
          id="how-it-works"
          aria-labelledby="hiw-heading"
          className="flex flex-col gap-8"
        >
          <div className="max-w-2xl">
            <Eyebrow>How it works</Eyebrow>
            <h2
              id="hiw-heading"
              className="mt-4 text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl"
            >
              Three writes. One human.{" "}
              <span className="font-display italic text-emerald-400">Zero balance.</span>
            </h2>
            <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
              PayoutBridge parses the settlement CSV, proposes the accounting
              in plain English, and only posts to Xero after you approve.
            </p>
          </div>

          <ol className="relative grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* connecting line on desktop */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            />
            <StepCard
              step="01"
              title="Gross invoice"
              body="Create an ACCREC invoice for £1,340 into Platform Clearing."
              amount="+£1,340"
              tone="positive"
            />
            <StepCard
              step="02"
              title="Fees expense"
              body="Book £445.90 commission and £47.10 fees from Platform Clearing."
              amount="−£493"
              tone="negative"
            />
            <StepCard
              step="03"
              title="Payment"
              body="Clear £847 against the bank deposit and verify £0.00 balance."
              amount="£0.00"
              tone="balanced"
            />
          </ol>
        </section>

        {/* Guarantees — numbered promises rail */}
        <section
          aria-labelledby="guarantees-heading"
          className="flex flex-col gap-8"
        >
          <div className="max-w-2xl">
            <Eyebrow tone="amber">Guarantees</Eyebrow>
            <h2
              id="guarantees-heading"
              className="mt-4 text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl"
            >
              Built for auditors,{" "}
              <span className="font-display italic text-amber-400">not vibes.</span>
            </h2>
            <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
              Three guarantees hold the entire posting pipeline together —
              enforced in code, not policy.
            </p>
          </div>

          <div className="divide-y divide-border rounded-2xl border border-border bg-card">
            <PromiseRow
              index="01"
              icon={<Scale className="size-5 text-primary" strokeWidth={1.75} />}
              title="Accounting invariant"
              body="Gross − commission − fees − refunds must equal net. The planner refuses to propose books that don't balance."
            />
            <PromiseRow
              index="02"
              icon={<ShieldCheck className="size-5 text-emerald-400" strokeWidth={1.75} />}
              title="Idempotent by file hash"
              body="Re-upload the same statement and PayoutBridge shows the existing Xero IDs instead of double-posting."
            />
            <PromiseRow
              index="03"
              icon={<FileText className="size-5 text-amber-400" strokeWidth={1.75} />}
              title="Full audit trail"
              body="Every request, every Xero ID, every timestamp — exportable transaction trace for your accountant."
            />
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative rounded-[2rem] bg-gradient-to-br from-primary/20 via-white/5 to-white/[0.02] p-1.5 ring-1 ring-white/10 shadow-[0_40px_100px_-50px_rgba(59,130,246,0.6)]">
          <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] border border-white/5 bg-gradient-to-br from-card via-background to-background p-10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] sm:p-16">
            <div
              aria-hidden
              className="absolute inset-x-0 -top-24 mx-auto h-56 w-3/4 rounded-full bg-primary/30 blur-3xl"
            />
            <Eyebrow>Get started</Eyebrow>
            <h2 className="relative mt-4 text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Ready to see your{" "}
              <span className="font-display italic text-primary">real turnover?</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              Create a free account and PayoutBridge will show you exactly how
              much revenue your bank feed has been hiding.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openAuthDialog("signup")}
                className="group inline-flex items-center gap-2 rounded-full bg-white py-3 pl-6 pr-3 text-sm font-semibold text-slate-900 shadow-xl shadow-black/30 ring-1 ring-white/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign up free
                <span className="grid size-7 place-items-center rounded-full bg-slate-900 text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px]">
                  <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </button>
              <button
                type="button"
                onClick={() => openAuthDialog("login")}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                I already have an account
              </button>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-primary" /> 3 writes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-emerald-400" /> zero-balance verification
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-amber-400" /> every action auditable
          </span>
        </footer>
      </div>
    </main>
  );
}

function StepCard({
  step,
  title,
  body,
  amount,
  tone,
}: {
  step: string;
  title: string;
  body: string;
  amount?: string;
  tone?: "positive" | "negative" | "balanced";
}) {
  const amountClass =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-rose-400"
        : "text-primary";
  return (
    <li className="relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="grid size-12 place-items-center rounded-full border border-border bg-background font-mono text-sm font-bold text-primary">
          {step}
        </span>
        {amount ? (
          <span className={`font-mono text-sm font-semibold tabular-nums ${amountClass}`}>
            {amount}
          </span>
        ) : null}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </li>
  );
}

function PromiseRow({
  index,
  icon,
  title,
  body,
}: {
  index: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-4 p-5 sm:p-6">
      <span className="font-mono text-xs font-semibold text-muted-foreground tabular-nums">
        {index}
      </span>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted ring-1 ring-border">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function MiniBar({
  label,
  value,
  tone,
  amount,
}: {
  label: string;
  value: number;
  tone: "muted" | "primary" | "success";
  amount: string;
}) {
  const barClass =
    tone === "muted"
      ? "bg-muted-foreground/40"
      : tone === "primary"
        ? "bg-gradient-to-t from-primary to-sky-400"
        : "bg-gradient-to-t from-emerald-500 to-emerald-300";
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <span className="font-mono text-[10px] font-semibold text-foreground/80 tabular-nums">
        {amount}
      </span>
      <div
        className={`w-full rounded-t-md ${barClass}`}
        style={{ height: `${Math.max(12, value * 96)}px` }}
      />
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function Eyebrow({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: "primary" | "rose" | "amber" | "emerald";
}) {
  const toneClass =
    tone === "rose"
      ? "border-rose-400/60 bg-rose-500/20 text-rose-100"
      : tone === "amber"
        ? "border-amber-400/60 bg-amber-500/20 text-amber-100"
        : tone === "emerald"
          ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
          : "border-primary/60 bg-primary/25 text-white";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${toneClass}`}
    >
      <span className="size-1 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}


