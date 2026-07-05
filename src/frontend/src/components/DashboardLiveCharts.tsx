import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePrefersReducedMotion } from "@/components/motion";

type FeeSlice = { name: string; value: number };
type RevenuePoint = { month: string; reported: number; real: number };
type PayoutPoint = { week: string; payouts: number };

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#ec4899"];
const AREA_REAL = "#3b82f6";
const AREA_REPORTED = "#94a3b8";

const RAD = Math.PI / 180;
/** Recharts polar convention: 0° = 3 o'clock, angles increase clockwise */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  return {
    x: cx + Math.cos(-angleDeg * RAD) * r,
    y: cy + Math.sin(-angleDeg * RAD) * r,
  };
}

/** Ripple crest orbits the ring clockwise — no pause between cycles */
const WAVE_ORIGIN_DEG = 135;
const WAVE_ORBIT_MS = 7200;
const WAVE_TRAIL_DEG = 85;
const WAVE_AMP_PX = 13;

function waveFrontDeg(t: number): number {
  const phase = (t % WAVE_ORBIT_MS) / WAVE_ORBIT_MS;
  return WAVE_ORIGIN_DEG + phase * 360;
}

function clockwiseBehind(angleDeg: number, frontDeg: number): number {
  let d = angleDeg - frontDeg;
  while (d < 0) d += 360;
  while (d >= 360) d -= 360;
  return d;
}

/** Radial displacement on the ring edge — ruffles in the wake of the traveling crest */
function edgeRipple(angleDeg: number, t: number): number {
  const front = waveFrontDeg(t);
  const behind = clockwiseBehind(angleDeg, front);
  if (behind > WAVE_TRAIL_DEG) return 0;

  const u = behind / WAVE_TRAIL_DEG;
  const swell = Math.sin(u * Math.PI) * (1 - u * 0.25);
  const ruffles = Math.sin(behind * RAD * 7.5);
  return WAVE_AMP_PX * swell * ruffles;
}

type PieSlice = FeeSlice & {
  startAngle: number;
  endAngle: number;
  color: string;
};

function layoutPieSlices(data: FeeSlice[], padDeg = 3.5): PieSlice[] {
  const total = data.reduce((s, d) => s + d.value, 0);
  const budget = 360 - padDeg * data.length;
  let cursor = 0;
  return data.map((d, i) => {
    const sweep = (d.value / total) * budget;
    const startAngle = cursor + padDeg / 2;
    const endAngle = startAngle + sweep;
    cursor = endAngle + padDeg / 2;
    return {
      ...d,
      startAngle,
      endAngle,
      color: PIE_COLORS[i % PIE_COLORS.length],
    };
  });
}

function wavySlicePath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
  rippleAt: (angleDeg: number) => number,
  steps = 56,
): string {
  const sweep = endAngle - startAngle;
  const large = sweep > 180 ? 1 : 0;
  const innerEnd = polar(cx, cy, innerR, endAngle);
  const innerStart = polar(cx, cy, innerR, startAngle);
  const outerStart = polar(cx, cy, outerR + rippleAt(startAngle), startAngle);

  const parts = [`M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`];

  for (let i = 1; i <= steps; i++) {
    const a = startAngle + (i / steps) * sweep;
    const r = outerR + rippleAt(a);
    const p = polar(cx, cy, r, a);
    parts.push(`L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
  }

  parts.push(`L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`);
  // Match Recharts Sector inner arc: end → start, sweep=1 when start < end
  parts.push(
    `A ${innerR} ${innerR} 0 ${large} 1 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
  );
  parts.push("Z");
  return parts.join(" ");
}

function useRippleTime(enabled: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      setT(now - t0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
  return t;
}

export function LiveFeesDonutChart({ data, total }: { data: FeeSlice[]; total: number }) {
  const reduced = usePrefersReducedMotion();
  const t = useRippleTime(!reduced);
  const slices = useMemo(() => layoutPieSlices(data), [data]);
  const cx = 130;
  const cy = 130;
  const innerR = 52;
  const outerR = 88;
  const ripple = (a: number) => (reduced ? 0 : edgeRipple(a, t));

  return (
    <div className="relative h-[260px] w-full">
      <svg viewBox="0 0 260 260" className="h-full w-full" aria-hidden={false}>
        <title>Fees breakdown donut chart</title>
        {slices.map((s) => (
          <path
            key={s.name}
            d={wavySlicePath(cx, cy, innerR, outerR, s.startAngle, s.endAngle, ripple)}
            fill={s.color}
            stroke="var(--card)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="rounded-xl bg-card/90 px-4 py-2 text-center ring-1 ring-border/80 backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Total fees
          </p>
          <p className="text-xl font-black tabular-nums text-foreground">
            £{total.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function useCycle(length: number, ms: number, enabled: boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!enabled || length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % length);
    }, ms);
    return () => window.clearInterval(id);
  }, [length, ms, enabled]);
  return index;
}

function LiveAreaDot(props: {
  cx?: number;
  cy?: number;
  index?: number;
  dataLength: number;
  color: string;
  reduced: boolean;
}) {
  const { cx = 0, cy = 0, index = 0, dataLength, color, reduced } = props;
  if (index !== dataLength - 1) return null;
  if (reduced) {
    return <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--card)" strokeWidth={2} />;
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill={color} opacity={0.2}>
        <animate attributeName="r" values="8;16;8" dur="2.4s" repeatCount="indefinite" />
        <animate
          attributeName="opacity"
          values="0.28;0.08;0.28"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="var(--card)" strokeWidth={2} />
    </g>
  );
}

export function LiveTurnoverAreaChart({ data }: { data: RevenuePoint[] }) {
  const reduced = usePrefersReducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 4000);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <div className="chart-live relative h-[260px] w-full">
      {!reduced ? (
        <div aria-hidden className="chart-scan-overlay pointer-events-none absolute inset-0 z-10" />
      ) : null}
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="realFillLive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={AREA_REAL} stopOpacity={reduced ? 0.5 : 0.55}>
                {!reduced ? (
                  <animate
                    attributeName="stop-opacity"
                    values="0.35;0.65;0.35"
                    dur="5s"
                    repeatCount="indefinite"
                  />
                ) : null}
              </stop>
              <stop offset="100%" stopColor={AREA_REAL} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="reportedFillLive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={AREA_REPORTED} stopOpacity={0.35} />
              <stop offset="100%" stopColor={AREA_REPORTED} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="var(--muted-foreground)"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
          />
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
            fill="url(#reportedFillLive)"
            strokeWidth={2}
            name="Reported"
            animationDuration={reduced ? 0 : 1200}
            animationEasing="ease-out"
            isAnimationActive={!reduced || tick === 0}
          />
          <Area
            type="monotone"
            dataKey="real"
            stroke={AREA_REAL}
            fill="url(#realFillLive)"
            strokeWidth={2}
            name="Real"
            animationDuration={reduced ? 0 : 1400}
            animationEasing="ease-out"
            isAnimationActive={!reduced || tick === 0}
            dot={(props) => (
              <LiveAreaDot
                {...props}
                dataLength={data.length}
                color={AREA_REAL}
                reduced={reduced}
              />
            )}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LivePayoutBarChart({ data }: { data: PayoutPoint[] }) {
  const reduced = usePrefersReducedMotion();
  const activeIndex = useCycle(data.length, 2200, !reduced);

  return (
    <div className="chart-live relative h-[220px] w-full">
      {!reduced ? (
        <div aria-hidden className="chart-scan-overlay pointer-events-none absolute inset-0 z-10" />
      ) : null}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="week"
            stroke="var(--muted-foreground)"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--foreground)",
            }}
          />
          <Bar
            dataKey="payouts"
            radius={[6, 6, 0, 0]}
            animationDuration={reduced ? 0 : 1200}
            animationEasing="ease-out"
          >
            {data.map((_, i) => {
              const hue = 158 + i * 8;
              const lit = 42 + i * 4;
              const active = !reduced && activeIndex === i;
              return (
                <Cell
                  key={i}
                  fill={`hsl(${hue}, 72%, ${active ? lit + 8 : lit}%)`}
                  opacity={reduced ? 1 : active ? 1 : 0.55}
                  style={
                    active
                      ? {
                          filter: `drop-shadow(0 0 10px hsl(${hue}, 72%, 50%))`,
                          transition: "opacity 400ms ease, filter 400ms ease",
                        }
                      : { transition: "opacity 400ms ease, filter 400ms ease" }
                  }
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LiveFeeLegend({
  data,
  colors = PIE_COLORS,
}: {
  data: FeeSlice[];
  colors?: string[];
}) {
  const reduced = usePrefersReducedMotion();
  const activeIndex = useCycle(data.length, 2800, !reduced);

  return (
    <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
      {data.map((f, i) => (
        <li
          key={f.name}
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-500 ${
            !reduced && activeIndex === i
              ? "bg-amber-500/10 ring-1 ring-amber-500/25"
              : "hover:bg-muted/30"
          }`}
        >
          <span
            className={`inline-block size-2.5 rounded-full ring-2 ring-white/10 transition-transform duration-500 ${
              !reduced && activeIndex === i ? "scale-125" : ""
            }`}
            style={{ background: colors[i % colors.length] }}
            aria-hidden
          />
          <span className="flex-1">{f.name}</span>
          <span
            className={`font-semibold tabular-nums transition-colors duration-500 ${
              !reduced && activeIndex === i ? "text-amber-300" : "text-foreground"
            }`}
          >
            £{f.value.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
}
