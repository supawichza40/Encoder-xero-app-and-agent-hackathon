import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Calculator,
  CheckCircle2,
  FileText,
  PoundSterling,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Chatbot } from "@/components/Chatbot";
import {
  LiveFeeLegend,
  LiveFeesDonutChart,
  LivePayoutBarChart,
  LiveTurnoverAreaChart,
} from "@/components/DashboardLiveCharts";
import { HeroReceipt } from "@/components/HeroReceipt";
import {
  CountUp,
  LiveDot,
  Marquee,
  Reveal,
  usePrefersReducedMotion,
  useRotatingIndex,
} from "@/components/motion";
import { openAuthDialog, useDemoAuth, type DemoUser, type Persona } from "@/lib/useDemoAuth";
import { fetchDashboard } from "@/lib/usePayoutBridge";
import type { DashboardResponse } from "@/lib/payout-types";

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

const kpiSparklines = {
  turnover: [12.4, 13.1, 14.2, 15.1, 16.8, 18.9],
  fees: [3.8, 4.1, 4.4, 4.6, 4.9, 5.0],
  payouts: [22, 24, 26, 27, 29, 30],
  clearing: [120, 80, 40, 10, 2, 0],
};

function Dashboard({ user }: { user: DemoUser }) {
  const [dash, setDash] = useState<DashboardResponse | null>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    void fetchDashboard().then((d) => {
      if (d) {
        setDash(d);
        setLive(true);
      }
    });
  }, []);

  const turnover = dash ? Number(dash.trial_balance.revenue) : 18930;
  const reported = 12210;
  const hiddenRevenue = turnover - reported;
  const feesTotal = dash ? Number(dash.trial_balance.fees_expense) : 5048;
  const payoutsCount = dash ? dash.recent_payouts.length * 5 : 30;
  const clearing = dash ? Number(dash.trial_balance.clearing) : 0;

  const reducedMotion = usePrefersReducedMotion();
  const insightIndex = useRotatingIndex(3, 4500, !reducedMotion);
  const insights = [
    <>
      £<CountUp value={hiddenRevenue} duration={1400} /> more turnover than your bank feed shows
    </>,
    <>
      {payoutsCount} payouts reconciled · <span className="text-emerald-400">6 this week</span>
    </>,
    <>
      Clearing verified at <span className="text-emerald-400">£{clearing.toFixed(2)}</span> ·
      zero-balance
    </>,
  ];

  const tickerItems = [
    {
      label: "Verified",
      detail: "MarketplaceCo · £1,340 gross · £847 net",
      tone: "success" as const,
    },
    {
      label: "Verified",
      detail: "MarketplaceCo · £980 gross · £642 net",
      tone: "success" as const,
    },
    { label: "Gap closed", detail: "+54.9% vs reported turnover", tone: "primary" as const },
    {
      label: "Fees visible",
      detail: `£${feesTotal.toLocaleString()} recovered this month`,
      tone: "warning" as const,
    },
    { label: "Idempotent", detail: "Duplicate upload blocked · Jun 24", tone: "warning" as const },
  ];

  const defaultActivity = [
    {
      date: "2026-07-02",
      source: "MarketplaceCo",
      gross: "1340.00",
      net: "847.00",
      status: "verified" as const,
    },
    {
      date: "2026-06-28",
      source: "MarketplaceCo",
      gross: "980.00",
      net: "642.00",
      status: "verified" as const,
    },
    {
      date: "2026-06-24",
      source: "MarketplaceCo",
      gross: "0.00",
      net: "0.00",
      status: "idempotent" as const,
    },
    {
      date: "2026-06-20",
      source: "MarketplaceCo",
      gross: "2110.00",
      net: "1368.00",
      status: "verified" as const,
    },
  ];
  const activityRows = dash?.recent_payouts.length ? dash.recent_payouts : defaultActivity;

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${reducedMotion ? "opacity-30" : "dashboard-grid-bg opacity-60"}`}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card/50 backdrop-blur-sm">
          <Marquee speed="slow" className="py-2.5">
            {tickerItems.map((item) => (
              <span
                key={item.detail}
                className="inline-flex items-center gap-2 px-6 text-xs text-muted-foreground"
              >
                <LiveDot
                  tone={
                    item.tone === "success"
                      ? "success"
                      : item.tone === "warning"
                        ? "warning"
                        : "primary"
                  }
                  className="size-1.5"
                />
                <span className="font-semibold uppercase tracking-wider text-foreground/80">
                  {item.label}
                </span>
                <span>{item.detail}</span>
              </span>
            ))}
          </Marquee>
        </div>

        {/* bento header row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div
            className="animate-fade-up hover-lift rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm lg:col-span-5"
            style={{ animationDelay: "0ms" }}
          >
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <LiveDot tone="success" className="size-1.5" />
              {user.name}&apos;s workspace
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Welcome back, <span className="text-primary/80">{user.name}</span>
            </h1>
            {live && dash ? (
              <p className="mt-1 text-[11px] text-emerald-500">
                Live from Xero · fetched{" "}
                {new Date(dash.fetched_at).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            ) : null}
            <p
              key={insightIndex}
              className={`mt-3 min-h-[1.5rem] text-sm text-muted-foreground sm:text-base ${!reducedMotion ? "insight-rotate" : ""}`}
            >
              {insights[insightIndex]}
            </p>
          </div>

          <div
            className="animate-fade-up hover-lift rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm lg:col-span-4"
            style={{ animationDelay: "80ms" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Reported vs real
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Bank feed</span>
                  <span className="tabular-nums">£12,210</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className={`h-full rounded-full bg-slate-500/80 ${!reducedMotion ? "gap-bar-reported" : ""}`}
                    style={{ width: reducedMotion ? "42%" : undefined }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-emerald-400/90">Real turnover</span>
                  <span className="font-semibold tabular-nums text-emerald-400">£18,930</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-emerald-500/15">
                  <div
                    className={`h-full rounded-full bg-emerald-500 ${!reducedMotion ? "gap-bar-real" : ""}`}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-emerald-400">
              +£
              <CountUp value={hiddenRevenue} duration={1600} /> recovered · +54.9%
            </p>
          </div>

          <Link
            to="/app"
            className={`animate-fade-up group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-emerald-500/35 bg-emerald-500/5 p-5 text-center transition-all hover:border-emerald-400 hover:bg-emerald-500/10 lg:col-span-3 ${!reducedMotion ? "upload-pulse-ring" : ""}`}
            style={{ animationDelay: "160ms" }}
          >
            <span className="grid size-12 place-items-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30 transition-transform duration-500 group-hover:scale-110">
              <Upload
                className={`size-5 text-emerald-400 ${!reducedMotion ? "animate-float" : ""}`}
                aria-hidden
              />
            </span>
            <span className="text-sm font-bold text-emerald-300">Upload payout</span>
            <span className="text-[11px] text-muted-foreground">Drop a settlement CSV</span>
          </Link>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-32 h-72 w-72 rounded-full bg-blue-500/8 blur-3xl animate-glow-pulse"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-1/4 h-56 w-56 rounded-full bg-emerald-500/8 blur-3xl animate-glow-pulse"
          style={{ animationDelay: "2.5s" }}
        />

        {/* KPI cards */}
        <section className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
            <KpiCard
              label={
                user.persona === "freelancer" ? "Income (Self Assessment)" : "Real turnover (MTD)"
              }
              numericValue={turnover}
              prefix="£"
              delta="+54.9% vs reported"
              tone="primary"
              sparkline={kpiSparklines.turnover}
              icon={<PoundSterling className="size-5" />}
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "260ms" }}>
            <KpiCard
              label="Fees recovered"
              numericValue={feesTotal}
              prefix="£"
              delta="+£812 vs last month"
              tone="amber"
              sparkline={kpiSparklines.fees}
              icon={<TrendingUp className="size-5" />}
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "340ms" }}>
            <KpiCard
              label="Payouts reconciled"
              numericValue={payoutsCount}
              delta="6 this week"
              tone="violet"
              sparkline={kpiSparklines.payouts}
              icon={<CheckCircle2 className="size-5" />}
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "420ms" }}>
            <KpiCard
              label="Clearing balance"
              numericValue={clearing}
              prefix="£"
              decimals={2}
              delta="Verified · zero-balance"
              tone="success"
              sparkline={kpiSparklines.clearing}
              pulse
              icon={<ShieldCheck className="size-5" />}
            />
          </div>
        </section>

        {/* Charts row */}
        <section className="relative grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="animate-fade-up lg:col-span-2" style={{ animationDelay: "580ms" }}>
            <ChartCard
              className="h-full"
              accent="blue"
              live
              title="Reported vs real turnover"
              subtitle="Last 6 months"
            >
              <LiveTurnoverAreaChart data={revenueSeries} />
              <div className="mt-3 flex flex-wrap gap-3 border-t border-border/60 pt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="size-2.5 rounded-full bg-slate-400 animate-glow-pulse"
                    aria-hidden
                  />{" "}
                  Reported
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="relative flex size-2.5 items-center justify-center" aria-hidden>
                    <span className="absolute inset-0 rounded-full bg-blue-500/40 animate-pulse-ring" />
                    <span className="size-2.5 rounded-full bg-blue-500" />
                  </span>{" "}
                  Real turnover
                </span>
              </div>
            </ChartCard>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "660ms" }}>
            <ChartCard
              accent="amber"
              className="h-full"
              live
              title="Fees this month"
              subtitle="Where £5,048 went"
            >
              <LiveFeesDonutChart data={feeBreakdown} total={feesTotal} />
              <LiveFeeLegend data={feeBreakdown} colors={PIE_COLORS} />
            </ChartCard>
          </div>
        </section>

        {/* Bar chart + activity row */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="animate-fade-up" style={{ animationDelay: "740ms" }}>
            <ChartCard
              accent="emerald"
              className="h-full"
              live
              title="Payouts reconciled per week"
              subtitle="Last 6 weeks"
            >
              <LivePayoutBarChart data={payoutsPerWeek} />
            </ChartCard>
          </div>

          <div className="animate-fade-up lg:col-span-2" style={{ animationDelay: "820ms" }}>
            <div className="hover-lift h-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-violet-500/5 p-5 ring-1 ring-violet-500/10">
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/25">
                    <FileText className="size-4 text-violet-400" aria-hidden />
                  </span>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Recent activity
                  </h3>
                </div>
                <Link
                  to="/app"
                  className="group inline-flex items-center gap-1 text-sm text-primary transition-colors hover:underline"
                >
                  View all{" "}
                  <ArrowUpRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </Link>
              </div>
              <ul className="mt-4 divide-y divide-border">
                {activityRows.map((p, i) => (
                  <ActivityRow
                    key={"file_hash" in p && p.file_hash ? p.file_hash : `${p.date}-${i}`}
                    delay={i * 70}
                    liveHighlight={i === 0}
                    status={p.status}
                    title={p.status === "idempotent" ? "Duplicate blocked" : `Payout ${p.date}`}
                    detail={
                      p.status === "idempotent"
                        ? `settlement-${p.date}.csv already posted`
                        : p.gross != null && p.net != null
                          ? `${p.source} · £${p.gross} gross · £${p.net} net`
                          : `${p.source} · posted to Xero · clearing £0.00`
                    }
                    time={p.date}
                  />
                ))}
                {dash && dash.recent_payouts.length === 0 ? (
                  <li className="py-6 text-center text-sm text-muted-foreground">
                    <p>No payouts yet.</p>
                    <Link to="/app" className="mt-2 inline-block text-primary hover:underline">
                      Upload your first payout statement →
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </section>

        <footer
          className="animate-fade-up pt-2 text-center text-xs text-muted-foreground"
          style={{ animationDelay: "900ms" }}
        >
          Signed in as {user.name} · demo session
          {live ? "" : " · figures are illustrative"}
        </footer>
      </div>
      <Chatbot />
    </main>
  );
}

function Sparkline({
  points,
  color,
  delay = 0,
  live = false,
}: {
  points: number[];
  color: string;
  delay?: number;
  live?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const max = Math.max(...points);
  const min = Math.min(...points);
  const w = 88;
  const h = 32;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / (max - min || 1)) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const gradId = `spark-${color.replace("#", "")}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`${live && !reduced ? "dashboard-sparkline-live" : "dashboard-sparkline"} h-8 w-[5.5rem] shrink-0 opacity-90`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${coords} ${w},${h}`} fill={`url(#${gradId})`} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
        style={{ animationDelay: `${delay}ms` }}
      />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  numericValue,
  prefix = "",
  decimals = 0,
  delta,
  tone,
  icon,
  sparkline,
  pulse,
}: {
  label: string;
  value?: string;
  numericValue?: number;
  prefix?: string;
  decimals?: number;
  delta: string;
  tone: "primary" | "amber" | "violet" | "success";
  icon: React.ReactNode;
  sparkline?: number[];
  pulse?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const accents =
    tone === "primary"
      ? {
          kpi: "dashboard-kpi-blue border-blue-500/40 bg-gradient-to-br from-blue-500/15 via-card to-card",
          bar: "border-blue-500",
          bg: "bg-blue-500/20",
          text: "text-blue-400",
          spark: "#3b82f6",
        }
      : tone === "amber"
        ? {
            kpi: "dashboard-kpi-amber border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-card to-card",
            bar: "border-amber-500",
            bg: "bg-amber-500/20",
            text: "text-amber-400",
            spark: "#f59e0b",
          }
        : tone === "violet"
          ? {
              kpi: "dashboard-kpi-violet border-violet-500/40 bg-gradient-to-br from-violet-500/15 via-card to-card",
              bar: "border-violet-500",
              bg: "bg-violet-500/20",
              text: "text-violet-400",
              spark: "#a78bfa",
            }
          : {
              kpi: "dashboard-kpi-emerald border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-card to-card",
              bar: "border-emerald-500",
              bg: "bg-emerald-500/20",
              text: "text-emerald-400",
              spark: "#10b981",
            };
  return (
    <div
      className={`dashboard-kpi group rounded-2xl border border-t-4 p-5 ${accents.kpi} ${accents.bar} ${!reduced ? "kpi-live-shimmer" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <span className="relative">
          {pulse ? (
            <span
              className="absolute inset-0 rounded-lg bg-emerald-400/40 animate-pulse-ring"
              aria-hidden
            />
          ) : null}
          <span
            className={`relative flex size-9 items-center justify-center rounded-xl ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${accents.bg} ${accents.text}`}
          >
            {icon}
          </span>
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-3xl font-black tracking-tight tabular-nums text-foreground">
          {numericValue !== undefined ? (
            <CountUp value={numericValue} prefix={prefix} decimals={decimals} />
          ) : (
            value
          )}
        </p>
        {sparkline ? <Sparkline points={sparkline} color={accents.spark} live={!reduced} /> : null}
      </div>
      <p className={`mt-2 text-xs font-semibold ${accents.text}`}>{delta}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
  accent = "blue",
  live = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  accent?: "blue" | "amber" | "emerald" | "violet";
  live?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const accentStyles =
    accent === "amber"
      ? "from-amber-500/10 via-card to-card ring-amber-500/15 border-amber-500/20"
      : accent === "emerald"
        ? "from-emerald-500/10 via-card to-card ring-emerald-500/15 border-emerald-500/20"
        : accent === "violet"
          ? "from-violet-500/10 via-card to-card ring-violet-500/15 border-violet-500/20"
          : "from-blue-500/10 via-card to-card ring-blue-500/15 border-blue-500/20";
  const barColor =
    accent === "amber"
      ? "from-amber-400 to-orange-500"
      : accent === "emerald"
        ? "from-emerald-400 to-teal-500"
        : accent === "violet"
          ? "from-violet-400 to-purple-500"
          : "from-sky-400 to-blue-600";
  return (
    <div
      className={`hover-lift relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ring-1 ${accentStyles} ${live && !reduced ? "chart-live" : ""} ${className ?? ""}`}
    >
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${barColor} ${!reduced ? "animate-gradient-shift bg-[length:200%_100%]" : ""}`}
      />
      <div className="mb-3 pt-1">
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
  delay = 0,
  liveHighlight = false,
}: {
  status: "verified" | "idempotent";
  title: string;
  detail: string;
  time: string;
  delay?: number;
  liveHighlight?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const badge =
    status === "verified"
      ? {
          label: "Verified",
          cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          border: "border-emerald-500/50",
        }
      : {
          label: "Idempotent",
          cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          border: "border-amber-500/50",
        };
  return (
    <li className="animate-slide-in" style={{ animationDelay: `${delay}ms` }}>
      <div
        className={`group flex items-center gap-3 border-l-[3px] py-3 pl-3 transition-all duration-300 hover:bg-white/[0.03] ${badge.border} ${
          liveHighlight && !reduced ? "activity-live-verified" : ""
        }`}
      >
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.cls}`}
        >
          {status === "verified" ? (
            <LiveDot tone="success" className="size-1.5" />
          ) : (
            <span className="inline-block size-1.5 rounded-full bg-amber-400" aria-hidden />
          )}
          {badge.label}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium transition-transform group-hover:translate-x-1">
            {title}
          </p>
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className="whitespace-nowrap rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
          {time}
        </span>
      </div>
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
          className="absolute -inset-[100%] animate-gradient-shift bg-gradient-to-br from-blue-900 from-40% to-emerald-600 to-60%"
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
            <span
              className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm"
              style={{ animationDelay: "80ms" }}
            >
              <Sparkles className="size-3.5 animate-pulse text-amber-300" aria-hidden />
              Human-in-the-loop · Xero-native · Auditable
            </span>

            <h1
              className="animate-fade-up text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.75rem]"
              style={{ animationDelay: "160ms" }}
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
                    className="animate-dash-draw"
                  />
                </svg>
              </span>{" "}
              about your turnover.
            </h1>

            <p
              className="animate-fade-up max-w-xl text-pretty text-base text-white/85 sm:text-lg"
              style={{ animationDelay: "280ms" }}
            >
              When a marketplace deducts commission and fees before wiring your payout, Xero only
              records the net deposit. PayoutBridge restores the real gross revenue, books the fees,
              and proves it with a live zero-balance clearing account — every write approved by you.
            </p>

            <div
              className="animate-fade-up flex flex-wrap items-center gap-3"
              style={{ animationDelay: "400ms" }}
            >
              <button
                type="button"
                onClick={() => openAuthDialog("signup")}
                className="btn-shimmer group inline-flex items-center gap-2 rounded-full bg-white py-3 pl-6 pr-3 text-sm font-semibold text-slate-900 shadow-xl shadow-blue-950/30 ring-1 ring-white/40 transition-transform hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
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

            <p
              className="animate-fade-up text-xs text-white/75"
              style={{ animationDelay: "520ms" }}
            >
              Free while in beta · no card required · takes under a minute.
            </p>
          </div>

          {/* right: product proof */}
          <div
            className="animate-fade-up flex justify-center lg:justify-end"
            style={{ animationDelay: "360ms" }}
          >
            <div className="animate-subtle-tilt transition-transform hover:rotate-0 hover:scale-[1.02]">
              <HeroReceipt />
            </div>
          </div>
        </div>
      </section>

      {/* scrolling trust strip */}
      <div className="relative z-10 border-y border-white/10 bg-background/80 py-3 backdrop-blur-sm">
        <Marquee className="opacity-70" speed="slow">
          <span className="inline-flex items-center gap-2 px-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <LiveDot tone="primary" /> Marketplace settlements
          </span>
          <span className="inline-flex items-center gap-2 px-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <LiveDot tone="success" /> Commission &amp; fees
          </span>
          <span className="inline-flex items-center gap-2 px-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <LiveDot tone="warning" /> Refund credits
          </span>
          <span className="inline-flex items-center gap-2 px-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <LiveDot tone="primary" /> Zero-balance clearing
          </span>
          <span className="inline-flex items-center gap-2 px-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <LiveDot tone="success" /> Gross-up journals
          </span>
          <span className="inline-flex items-center gap-2 px-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <LiveDot tone="primary" /> Xero Demo Company
          </span>
        </Marquee>
      </div>

      {/* fade bridge between hero gradient and page background */}
      <div
        aria-hidden
        className="-mt-8 h-16 w-full bg-gradient-to-b from-blue-600/40 via-background/60 to-background"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 pb-20 sm:px-6">
        {/* Who it's for — 3 personas */}
        <section aria-labelledby="personas-heading" className="flex flex-col gap-8">
          <div className="max-w-2xl">
            <Eyebrow>Who it's for</Eyebrow>
            <h2
              id="personas-heading"
              className="mt-4 text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl"
            >
              Three doors, <span className="font-display italic text-emerald-400">one room.</span>
            </h2>
            <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
              Same deterministic engine, tuned to how you think about your books.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <PersonaCard
              persona="owner"
              title="I run the business"
              pain="Your bank feed shows £847 and calls it revenue — real turnover was £1,340."
              value="True turnover, fees booked, £0.00 proof — no accounting degree."
              icon={<Briefcase className="size-5 text-primary" strokeWidth={1.75} />}
            />
            <PersonaCard
              persona="bookkeeper"
              title="I keep the books"
              pain="Grossing up settlement statements by hand for every client."
              value="Deterministic 3-write plan, every figure traceable to a Xero ID."
              icon={<Calculator className="size-5 text-emerald-400" strokeWidth={1.75} />}
            />
            <PersonaCard
              persona="freelancer"
              title="I work for myself"
              pain="Reported income understated by withheld fees — wrong tax filing."
              value="Correct income and deductible fees for Self Assessment."
              icon={<User className="size-5 text-amber-400" strokeWidth={1.75} />}
            />
          </div>
        </section>

        {/* Why sign up — asymmetric bento */}
        <Reveal as="section" aria-labelledby="why-heading" className="flex flex-col gap-8">
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
              A free account unlocks the full workspace: dashboard, saved audit trails, and
              one-click posting to Xero.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2">
            {/* wide feature */}
            <Reveal delay={80} className="md:col-span-4 md:row-span-2">
              <div className="hover-lift group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <TrendingUp className="size-5 text-primary" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">See your real turnover</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      A live dashboard shows reported vs real revenue and fees recovered — updated
                      on every approval.
                    </p>
                  </div>
                </div>

                {/* mini bar-comparison visual */}
                <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <MiniBar
                      label="Reported"
                      value={0.42}
                      tone="muted"
                      amount="£9.1k"
                      delay={200}
                    />
                    <MiniBar label="Real" value={1} tone="primary" amount="£15.7k" delay={320} />
                    <MiniBar
                      label="Recovered"
                      value={0.32}
                      tone="success"
                      amount="+£6.6k"
                      delay={440}
                    />
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={160} className="md:col-span-2">
              <div className="hover-lift h-full rounded-2xl border border-border bg-card p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <FileText className="size-5 text-emerald-400" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-base font-semibold">Keep every audit trail</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Signed-in workspaces save every proposal, Xero ID, and timestamp so your
                  accountant never has to ask twice.
                </p>
              </div>
            </Reveal>

            <Reveal delay={240} className="md:col-span-2">
              <div className="hover-lift h-full rounded-2xl border border-border bg-card p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                  <ShieldCheck className="size-5 text-violet-400" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-base font-semibold">Post safely to Xero</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connect once and PayoutBridge is idempotent by file hash — re-uploads never
                  double-post.
                </p>
              </div>
            </Reveal>
          </div>
        </Reveal>

        {/* Attraction panel — £493 stat as centerpiece */}
        <Reveal
          as="section"
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
                  Marketplace payouts arrive net of commission, fees, and refunds — so Xero records
                  a fraction of your actual turnover. PayoutBridge rebuilds the full picture with
                  three Xero-native writes and a zero-balance clearing account.
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
                  <p className="mt-5 bg-gradient-to-br from-rose-200 via-rose-400 to-red-600 bg-clip-text pb-2 font-display text-8xl font-normal leading-none tracking-tight text-transparent tabular-nums sm:text-[9rem]">
                    £<CountUp value={493} duration={1600} />
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    per <span className="font-mono tabular-nums text-foreground/80">£1,340</span>{" "}
                    marketplace payout
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
        </Reveal>

        {/* How it works — timeline rail */}
        <Reveal
          as="section"
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
              PayoutBridge parses the settlement CSV, proposes the accounting in plain English, and
              only posts to Xero after you approve.
            </p>
          </div>

          <ol className="relative grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* connecting line on desktop */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            />
            <StepCard
              delay={0}
              step="01"
              title="Gross invoice"
              body="Create an ACCREC invoice for £1,340 into Platform Clearing."
              amount="+£1,340"
              tone="positive"
            />
            <StepCard
              delay={120}
              step="02"
              title="Fees expense"
              body="Book £445.90 commission and £47.10 fees from Platform Clearing."
              amount="−£493"
              tone="negative"
            />
            <StepCard
              delay={240}
              step="03"
              title="Payment"
              body="Clear £847 against the bank deposit and verify £0.00 balance."
              amount="£0.00"
              tone="balanced"
            />
          </ol>
        </Reveal>

        {/* Guarantees — numbered promises rail */}
        <Reveal as="section" aria-labelledby="guarantees-heading" className="flex flex-col gap-8">
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
              Three guarantees hold the entire posting pipeline together — enforced in code, not
              policy.
            </p>
          </div>

          <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
            <PromiseRow
              delay={0}
              index="01"
              icon={<Scale className="size-5 text-primary" strokeWidth={1.75} />}
              title="Accounting invariant"
              body="Gross − commission − fees − refunds must equal net. The planner refuses to propose books that don't balance."
            />
            <PromiseRow
              delay={100}
              index="02"
              icon={<ShieldCheck className="size-5 text-emerald-400" strokeWidth={1.75} />}
              title="Idempotent by file hash"
              body="Re-upload the same statement and PayoutBridge shows the existing Xero IDs instead of double-posting."
            />
            <PromiseRow
              delay={200}
              index="03"
              icon={<FileText className="size-5 text-amber-400" strokeWidth={1.75} />}
              title="Full audit trail"
              body="Every request, every Xero ID, every timestamp — exportable transaction trace for your accountant."
            />
          </div>
        </Reveal>

        {/* Final CTA */}
        <Reveal
          as="section"
          className="relative rounded-[2rem] bg-gradient-to-br from-primary/20 via-white/5 to-white/[0.02] p-1.5 ring-1 ring-white/10 shadow-[0_40px_100px_-50px_rgba(59,130,246,0.6)]"
        >
          <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] border border-white/5 bg-gradient-to-br from-card via-background to-background p-10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] sm:p-16">
            <div
              aria-hidden
              className="absolute inset-x-0 -top-24 mx-auto h-56 w-3/4 rounded-full bg-primary/30 blur-3xl animate-glow-pulse"
            />
            <Eyebrow>Get started</Eyebrow>
            <h2 className="relative mt-4 text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Ready to see your{" "}
              <span className="font-display italic text-primary">real turnover?</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              Create a free account and PayoutBridge will show you exactly how much revenue your
              bank feed has been hiding.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openAuthDialog("signup")}
                className="btn-shimmer group inline-flex items-center gap-2 rounded-full bg-white py-3 pl-6 pr-3 text-sm font-semibold text-slate-900 shadow-xl shadow-black/30 ring-1 ring-white/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.03] active:scale-[0.98]"
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
        </Reveal>

        <footer className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <LiveDot tone="primary" className="size-1.5" /> 3 writes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LiveDot tone="success" className="size-1.5" /> zero-balance verification
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LiveDot tone="warning" className="size-1.5" /> every action auditable
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
  delay = 0,
}: {
  step: string;
  title: string;
  body: string;
  amount?: string;
  tone?: "positive" | "negative" | "balanced";
  delay?: number;
}) {
  const amountClass =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-rose-400"
        : "text-primary";
  return (
    <Reveal as="li" delay={delay}>
      <div className="hover-lift group relative flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
        <div className="flex items-center justify-between">
          <span className="grid size-12 place-items-center rounded-full border border-border bg-background font-mono text-sm font-bold text-primary transition-transform duration-500 group-hover:scale-110">
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
      </div>
    </Reveal>
  );
}

function PromiseRow({
  index,
  icon,
  title,
  body,
  delay = 0,
}: {
  index: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="group grid grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-4 p-5 transition-colors hover:bg-muted/20 sm:p-6">
        <span className="font-mono text-xs font-semibold text-muted-foreground tabular-nums transition-colors group-hover:text-primary">
          {index}
        </span>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted ring-1 ring-border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
    </Reveal>
  );
}

function MiniBar({
  label,
  value,
  tone,
  amount,
  delay = 0,
}: {
  label: string;
  value: number;
  tone: "muted" | "primary" | "success";
  amount: string;
  delay?: number;
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
      <Reveal delay={delay} className="w-full">
        <div
          className={`w-full animate-bar-grow rounded-t-md ${barClass}`}
          style={{
            height: `${Math.max(12, value * 96)}px`,
            animationDelay: `${delay}ms`,
          }}
        />
      </Reveal>
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
      ? "border-rose-400/60 bg-rose-500/20 text-rose-700 dark:text-rose-100"
      : tone === "amber"
        ? "border-amber-400/60 bg-amber-500/20 text-amber-700 dark:text-amber-100"
        : tone === "emerald"
          ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-700 dark:text-emerald-100"
          : "border-primary/60 bg-primary/25 text-primary-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${toneClass}`}
    >
      <span className="size-1 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

function PersonaCard({
  persona,
  title,
  pain,
  value,
  icon,
}: {
  persona: Persona;
  title: string;
  pain: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => openAuthDialog("signup", persona)}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-muted ring-1 ring-border">
        {icon}
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-rose-400/90">{pain}</p>
      <p className="text-sm text-foreground/80">{value}</p>
      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold text-primary group-hover:underline">
        Start as {title.toLowerCase().replace(/^i /, "")} <ArrowRight className="size-3.5" />
      </span>
    </button>
  );
}
