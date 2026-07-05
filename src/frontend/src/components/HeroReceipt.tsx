import { Check, FileText, MinusCircle, Wallet } from "lucide-react";

/**
 * A compact "reconciliation receipt" mock shown on the hero.
 * Purely presentational — no data, no interaction.
 */
export function HeroReceipt() {
  return (
    <div aria-hidden className="pointer-events-none relative w-full max-w-md select-none">
      {/* soft ambient glow */}
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-white/10 blur-2xl" />

      <div className="rounded-2xl border border-white/15 bg-slate-950/70 p-1.5 shadow-2xl shadow-blue-950/40 backdrop-blur-xl ring-1 ring-white/10">
        <div className="rounded-[calc(1rem-0.375rem)] bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5">
          {/* header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-md bg-blue-500/20 ring-1 ring-blue-400/40">
                <FileText className="size-3.5 text-blue-200" />
              </span>
              <div className="leading-tight">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                  Settlement
                </p>
                <p className="font-mono text-xs text-white/80">PAY-2087 · 04 Jul</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/30">
              Balanced
            </span>
          </div>

          {/* ledger rows */}
          <ul className="mt-3 divide-y divide-white/5">
            <ReceiptRow
              icon={<Wallet className="size-3.5 text-white/70" />}
              label="Gross invoice"
              sub="ACCREC · Platform Clearing"
              amount="+£1,340.00"
              tone="positive"
            />
            <ReceiptRow
              icon={<MinusCircle className="size-3.5 text-white/70" />}
              label="Commission"
              sub="Marketplace fees"
              amount="−£445.90"
              tone="negative"
            />
            <ReceiptRow
              icon={<MinusCircle className="size-3.5 text-white/70" />}
              label="Prepayment fees"
              sub="Processor · net-of"
              amount="−£47.10"
              tone="negative"
            />
            <ReceiptRow
              icon={<Wallet className="size-3.5 text-white/70" />}
              label="Bank deposit"
              sub="Cleared today"
              amount="−£847.00"
              tone="neutral"
            />
          </ul>

          {/* footer / balance */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2.5 ring-1 ring-emerald-400/25">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-emerald-400/25 ring-1 ring-emerald-300/40">
                <Check className="size-3.5 text-emerald-200" />
              </span>
              <span className="text-xs font-medium text-emerald-100">Clearing balance</span>
            </div>
            <span className="font-mono text-sm font-bold text-emerald-200 tabular-nums">£0.00</span>
          </div>

          {/* revenue recovered badge */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-white/60">
            <span>Hidden revenue recovered</span>
            <span className="font-mono font-semibold text-white tabular-nums">+£493.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({
  icon,
  label,
  sub,
  amount,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  amount: string;
  tone: "positive" | "negative" | "neutral";
}) {
  const amountClass =
    tone === "positive"
      ? "text-emerald-300"
      : tone === "negative"
        ? "text-rose-300"
        : "text-white/80";
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white/5 ring-1 ring-white/10">
          {icon}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-xs font-medium text-white/90">{label}</p>
          <p className="truncate text-[10px] text-white/50">{sub}</p>
        </div>
      </div>
      <span className={`shrink-0 font-mono text-xs font-semibold tabular-nums ${amountClass}`}>
        {amount}
      </span>
    </li>
  );
}
