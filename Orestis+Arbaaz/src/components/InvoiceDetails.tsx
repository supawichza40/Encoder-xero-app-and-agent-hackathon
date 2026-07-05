import { FileText, Calendar, Hash, Paperclip, X } from "lucide-react";
import type { AttachmentResult, ProposalResponse } from "@/lib/payout-types";

interface Props {
  fileName: string;
  uploadedAt: string;
  proposal: ProposalResponse;
  onClose: () => void;
  attachment?: AttachmentResult | null;
}

export function InvoiceDetails({ fileName, uploadedAt, proposal, onClose, attachment }: Props) {
  const { payout } = proposal;
  const feesTotal = (Number(payout.commission) + Number(payout.fees)).toFixed(2);

  return (
    <section
      aria-label="Selected invoice details"
      className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 h-5 w-5 text-blue-500" />
          <div>
            <h2 className="text-base font-semibold text-foreground">{fileName}</h2>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Uploaded {new Date(uploadedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 rounded-md border border-red-400 bg-red-400/10 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-400/20 hover:text-red-500"
        >
          <X className="h-3.5 w-3.5" />
          Close
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Payout ref</dt>
          <dd className="font-medium text-foreground">{payout.payout_ref}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Period</dt>
          <dd className="font-medium text-foreground">{payout.period}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</dt>
          <dd className="font-medium text-foreground capitalize">{proposal.status}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Bookings</dt>
          <dd className="font-medium text-foreground">{payout.bookings.length}</dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Gross" value={payout.gross} tone="text-blue-500" />
        <Metric label="Fees" value={feesTotal} tone="text-amber-500" />
        <Metric label="Refunds" value={payout.refunds} tone="text-rose-500" />
        <Metric label="Net" value={payout.net} tone="text-emerald-500" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Hash className="h-3 w-3" />
          <span className="truncate font-mono">{proposal.file_hash}</span>
        </span>
        {attachment && attachment.status === "success" ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-500">
            <Paperclip className="h-3 w-3" /> Source CSV attached to invoice
          </span>
        ) : null}
      </div>

      {payout.bookings.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Client</th>
                <th className="px-3 py-2 text-left font-medium">Service</th>
                <th className="px-3 py-2 text-right font-medium">Gross</th>
                <th className="px-3 py-2 text-right font-medium">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payout.bookings.map((b, i) => (
                <tr key={i} className="text-foreground">
                  <td className="px-3 py-2">{b.date}</td>
                  <td className="px-3 py-2">{b.client}</td>
                  <td className="px-3 py-2">{b.service}</td>
                  <td className="px-3 py-2 text-right">£{b.gross_amount}</td>
                  <td className="px-3 py-2 text-right">£{b.commission}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${tone}`}>£{value}</p>
    </div>
  );
}
