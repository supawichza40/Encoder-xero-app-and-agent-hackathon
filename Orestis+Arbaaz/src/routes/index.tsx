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
    <main className="flex min-h-screen w-full flex-col gap-16 py-10 sm:py-16">
      {/* Hero */}
      <section
        className="relative isolate overflow-hidden rounded-none px-4 py-12 sm:px-6 sm:py-16"
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
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-amber-300" aria-hidden />
            Human-in-the-loop · Xero-native · Auditable
          </span>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your bank feed has been{" "}
            <span className="text-white/90">lying</span> about your turnover.
          </h1>
          <p className="max-w-2xl text-base text-white/80 sm:text-lg">
            When a marketplace deducts commission and fees before wiring your
            payout, Xero only records the net deposit. PayoutBridge restores the
            real gross revenue, books the fees, and proves it with a live
            zero-balance clearing account — every write approved by you.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openAuthDialog("signup")}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-red-600 shadow-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-600"
            >
              <UserPlus className="size-4" aria-hidden />
              Create your account
            </button>
            <button
              type="button"
              onClick={() => openAuthDialog("login")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Log in
            </button>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              See how it works →
            </a>
          </div>
          <p className="text-xs text-white/70">
            Free while in beta · no card required · takes under a minute.
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 sm:px-6">
        {/* Why sign up */}
      <section aria-labelledby="why-heading" className="flex flex-col gap-6">
        <div>
          <h2 id="why-heading" className="text-2xl font-bold sm:text-3xl">
            Why teams sign up for PayoutBridge
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            A free account unlocks the full workspace: dashboard, saved audit
            trails, and one-click posting to Xero.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <BenefitCard
            icon={<TrendingUp className="size-5 text-blue-500" />}
            title="See your real turnover"
            body="A live dashboard shows reported vs real revenue and fees recovered — updated on every approval."
          />
          <BenefitCard
            icon={<FileText className="size-5 text-emerald-500" />}
            title="Keep every audit trail"
            body="Signed-in workspaces save every proposal, Xero ID, and timestamp so your accountant never has to ask twice."
          />
          <BenefitCard
            icon={<ShieldCheck className="size-5 text-violet-500" />}
            title="Post safely to Xero"
            body="Connect once and PayoutBridge is idempotent by file hash — re-uploads never double-post."
          />
        </div>
      </section>

      {/* Attraction panel */}
      <section
        aria-labelledby="problem-heading"
        className="rounded-2xl border border-border bg-card p-6 sm:p-8"
      >
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2
              id="problem-heading"
              className="text-2xl font-bold sm:text-3xl"
            >
              Stop losing revenue in plain sight.
            </h2>
            <p className="text-muted-foreground">
              Marketplace payouts arrive net of commission, fees, and refunds —
              so Xero records a fraction of your actual turnover. PayoutBridge
              rebuilds the full picture with three Xero-native writes and a
              zero-balance clearing account.
            </p>
            <ul className="space-y-2 text-sm">
              {[
                "Recover hidden commission and fee expenses.",
                "Keep a live, auditable trail for every payout.",
                "Post once — re-uploading the same file never double-posts.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-500"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-6 text-center">
            <p className="text-sm text-muted-foreground">Typical understatement</p>
            <p className="mt-2 text-5xl font-black tracking-tight text-destructive">
              £493
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              per £1,340 marketplace payout
            </p>
            <button
              type="button"
              onClick={() => openAuthDialog("signup")}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <UserPlus className="size-4" aria-hidden />
              Find yours
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" aria-labelledby="hiw-heading" className="flex flex-col gap-6">
        <div>
          <h2 id="hiw-heading" className="text-2xl font-bold sm:text-3xl">
            Three writes. One human. Zero balance.
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            PayoutBridge parses the settlement CSV, proposes the accounting in
            plain English, and only posts to Xero after you approve.
          </p>
        </div>
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StepCard
            step="1"
            title="Gross invoice"
            body="Create an ACCREC invoice for £1,340 into Platform Clearing."
          />
          <StepCard
            step="2"
            title="Fees expense"
            body="Book £445.90 commission and £47.10 fees from Platform Clearing."
          />
          <StepCard
            step="3"
            title="Payment"
            body="Clear £847 against the bank deposit and verify £0.00 balance."
          />
        </ol>
      </section>

      {/* Guarantees */}
      <section aria-labelledby="guarantees-heading" className="flex flex-col gap-6">
        <h2 id="guarantees-heading" className="text-2xl font-bold sm:text-3xl">
          Built for auditors, not vibes.
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<Scale className="size-5 text-blue-500" />}
            title="Accounting invariant"
            body="Gross − commission − fees − refunds must equal net. The planner refuses to propose books that don't balance."
          />
          <FeatureCard
            icon={<ShieldCheck className="size-5 text-emerald-500" />}
            title="Idempotent by file hash"
            body="Re-upload the same statement and PayoutBridge shows the existing Xero IDs instead of double-posting."
          />
          <FeatureCard
            icon={<FileText className="size-5 text-amber-500" />}
            title="Full audit trail"
            body="Every request, every Xero ID, every timestamp — exportable transaction trace for your accountant."
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-2xl border border-primary/40 bg-primary/5 p-8 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">
          Ready to see your real turnover?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Create a free account and PayoutBridge will show you exactly how much
          revenue your bank feed has been hiding.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openAuthDialog("signup")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <UserPlus className="size-4" aria-hidden />
            Sign up free
          </button>
          <button
            type="button"
            onClick={() => openAuthDialog("login")}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-500 bg-background px-6 py-3 text-sm font-medium text-blue-500 transition-colors hover:bg-blue-500/10"
          >
            I already have an account
          </button>
        </div>
      </section>

      <footer className="pt-4 text-center text-xs text-muted-foreground">
        3 writes · zero-balance verification · every action auditable
      </footer>
      </div>
    </main>
  );
}


function StepCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
        {step}
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </li>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </span>
        <CheckCircle2 className="ml-auto size-4 text-emerald-500" aria-hidden />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
