import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Reveal } from "@/components/motion";
import { Navbar } from "@/components/Navbar";

import { fetchEvidencePack, usePayoutBridge } from "@/lib/usePayoutBridge";
import { useDemoAuth, type Persona } from "@/lib/useDemoAuth";
import { PERSONA_COPY } from "@/lib/personaTheme";
import type { EvidencePack } from "@/lib/payout-types";
import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/FileUpload";
import { ApprovalDrawer } from "@/components/ApprovalDrawer";
import { IdempotencyBanner } from "@/components/IdempotencyBanner";
import { StepProgress } from "@/components/StepProgress";
import { ClearingReconciliation } from "@/components/ClearingReconciliation";
import { PnLComparison } from "@/components/PnLComparison";
import { AuditTrail } from "@/components/AuditTrail";
import { TaxSummaryCard } from "@/components/TaxSummaryCard";
import { InvoiceHistory, saveHistoryEntry, type HistoryEntry } from "@/components/InvoiceHistory";
import { InvoiceDetails } from "@/components/InvoiceDetails";
import { makeSampleFile } from "@/lib/sample-csv";

// §3.5 — per-persona section order + auto-expand on the verified /app state.
// Exported (pure) so ordering/expansion is unit-testable without mounting the
// full route. Reordering this array reorders the DOM, not just CSS.
export type VerifiedSection = "tax" | "clearing" | "pnl" | "audit";

export function personaSectionOrder(persona: Persona): VerifiedSection[] {
  switch (persona) {
    case "bookkeeper":
      return ["clearing", "audit", "pnl"];
    case "freelancer":
      return ["tax", "clearing", "pnl", "audit"];
    default:
      return ["clearing", "pnl", "audit"];
  }
}

// PRI-2 evidence pack (§3.4, §6 Bookkeeper hero) — CSV hash + Xero IDs + £0.00
// proof in one exportable card. Null-safe: an unknown/not-yet-posted hash
// resolves to null (contract 404 equivalent) and is handled, never crashes.
export function EvidencePackCard({ fileHash, persona }: { fileHash: string; persona: Persona }) {
  const [pack, setPack] = useState<EvidencePack | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const promoted = persona === "bookkeeper";

  const handleFetch = async () => {
    setLoading(true);
    setNotFound(false);
    const result = await fetchEvidencePack(fileHash);
    setLoading(false);
    if (!result) {
      setNotFound(true);
      setPack(null);
      return;
    }
    setPack(result);
  };

  return (
    <section
      aria-labelledby="evidence-pack-heading"
      className={cn(
        "w-full rounded-xl border p-4",
        promoted ? "border-primary/40 bg-primary/5" : "border-border bg-card/40",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="evidence-pack-heading"
          className="text-xs uppercase tracking-widest text-muted-foreground"
        >
          Evidence pack
        </h2>
        <button
          type="button"
          onClick={() => void handleFetch()}
          aria-label="Download evidence pack"
          disabled={loading}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-transform duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            promoted
              ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
              : "border-border bg-transparent text-muted-foreground hover:bg-muted",
          )}
        >
          <Download className="size-3.5" aria-hidden />
          {loading ? "Loading…" : "Evidence pack"}
        </button>
      </div>
      {notFound ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No evidence pack on file for this run yet.
        </p>
      ) : null}
      {pack ? (
        <dl className="tabular mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">CSV hash</dt>
            <dd className="font-mono">{pack.csv_sha256.slice(0, 12)}…</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Invoice</dt>
            <dd className="font-mono">{pack.xero_ids.invoice_id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Bank txn</dt>
            <dd className="font-mono">{pack.xero_ids.bank_txn_id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Clearing</dt>
            <dd className={cn("font-mono", pack.verified ? "text-success" : "text-destructive")}>
              £{pack.clearing_balance}
            </dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "PayoutBridge — Xero-native marketplace settlement gross-up" },
      {
        name: "description",
        content:
          "Convert opaque marketplace settlement statements into auditable, Xero-native gross-up accounting with a human-approved zero-balance clearing.",
      },
      { property: "og:title", content: "PayoutBridge" },
      {
        property: "og:description",
        content:
          "Your bank feed has been lying about your turnover. Restore real revenue, fee visibility, and a zero-balance clearing account in Xero.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const bridge = usePayoutBridge();
  const { user } = useDemoAuth();
  const persona = user?.persona ?? "owner";
  const clearingRef = useRef<HTMLDivElement>(null);
  const [lastFileName, setLastFileName] = useState<string | null>(null);
  const lastFileRef = useRef<File | null>(null);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const savedHashRef = useRef<string | null>(null);

  useEffect(() => {
    if (bridge.phase === "verified" && clearingRef.current) {
      clearingRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [bridge.phase]);

  // Persist a history entry when a fresh proposal arrives.
  useEffect(() => {
    if (bridge.proposal && lastFileName && savedHashRef.current !== bridge.proposal.file_hash) {
      savedHashRef.current = bridge.proposal.file_hash;
      saveHistoryEntry({
        id: bridge.proposal.file_hash,
        fileName: lastFileName,
        uploadedAt: new Date().toISOString(),
        proposal: bridge.proposal,
      });
    }
  }, [bridge.proposal, lastFileName]);

  const handleFile = (f: File) => {
    setLastFileName(f.name);
    lastFileRef.current = f;
    setSelected(null);
    void bridge.uploadFile(f);
  };

  const loadSample = (kind: "golden" | "refund") => {
    // Real CSV bytes (fixture copies) so Live mode's /propose parses them;
    // the Demo-mode mock still routes on the filename.
    handleFile(makeSampleFile(kind));
  };

  const reuploadLast = () => {
    const f = lastFileRef.current;
    if (!f) return;
    // Re-submit the ORIGINAL File object: identical bytes give the same
    // sha256 in Live mode and the same name/size/lastModified mock hash in
    // Demo mode — both are required for the idempotency showcase.
    handleFile(f);
  };

  const uploadDisabled =
    bridge.phase === "uploading" ||
    bridge.phase === "proposed" ||
    bridge.phase === "approving" ||
    bridge.phase === "idempotent";

  const feesTotal = bridge.proposal
    ? (Number(bridge.proposal.payout.commission) + Number(bridge.proposal.payout.fees)).toFixed(2)
    : "0.00";

  // §3.5 note: identical strings to the previous inline ternary — now sourced
  // from the single-source-of-truth copy map (PERSONA-DESIGN.md §4).
  const approvalHeading = PERSONA_COPY[persona].checklistHeading;

  return (
    <>
      <Navbar />
      <main
        data-persona={persona}
        className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-6 overflow-hidden px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[260px_1fr]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/3 h-64 w-64 rounded-full bg-primary/8 blur-3xl animate-glow-pulse"
        />
        <Reveal className="lg:sticky lg:top-6 lg:self-start" delay={0}>
          <InvoiceHistory selectedId={selected?.id ?? null} onSelect={(e) => setSelected(e)} />
        </Reveal>

        <div className="flex flex-col gap-6">
          <Reveal as="header" className="flex flex-col gap-3" delay={80}>
            <Link
              to="/"
              className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              ← Back to home
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              PayoutBridge
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Your bank feed has been lying about your turnover.
            </p>
          </Reveal>

          {selected ? (
            <Reveal delay={120}>
              <InvoiceDetails
                fileName={selected.fileName}
                uploadedAt={selected.uploadedAt}
                proposal={selected.proposal}
                onClose={() => setSelected(null)}
                attachment={bridge.approval?.attachment ?? null}
              />
            </Reveal>
          ) : (
            <>
              <Reveal delay={140}>
                <FileUpload
                  onFileSelected={handleFile}
                  disabled={uploadDisabled}
                  loading={bridge.phase === "uploading"}
                  error={bridge.phase === "error" ? bridge.error : null}
                  compact={Boolean(bridge.proposal)}
                />
              </Reveal>

              {bridge.phase === "idle" ||
              bridge.phase === "error" ||
              bridge.phase === "verified" ||
              bridge.phase === "idempotent" ||
              bridge.phase === "partial_error" ? (
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-card/40 p-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Try a sample
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadSample("golden")}
                      disabled={uploadDisabled}
                      className="inline-flex items-center gap-2 rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-500 transition-[color,background-color,transform] duration-150 hover:bg-blue-500/20 active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      MarketplaceCo payout · 3 writes
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSample("refund")}
                      disabled={uploadDisabled}
                      className="inline-flex items-center gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-500 transition-[color,background-color,transform] duration-150 hover:bg-rose-500/20 active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Payout with refunds · 4 writes
                    </button>
                    {lastFileRef.current ? (
                      <button
                        type="button"
                        onClick={reuploadLast}
                        disabled={uploadDisabled}
                        className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-500 transition-[color,background-color,transform] duration-150 hover:bg-amber-500/20 active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Re-upload last file (idempotent)
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {bridge.phase === "idempotent" && bridge.proposal?.existing_ids ? (
                <Reveal delay={160}>
                  <IdempotencyBanner
                    existingIds={bridge.proposal.existing_ids}
                    onReset={bridge.reset}
                    persona={persona}
                  />
                </Reveal>
              ) : null}

              {(bridge.phase === "proposed" ||
                bridge.phase === "approving" ||
                bridge.phase === "verified") &&
              bridge.proposal &&
              bridge.proposal.plan ? (
                <Reveal delay={180}>
                  <ApprovalDrawer
                    payout={bridge.proposal.payout}
                    plan={bridge.proposal.plan}
                    fileHash={bridge.proposal.file_hash}
                    onApprove={() => void bridge.approve()}
                    disabled={bridge.phase !== "proposed"}
                    loading={bridge.phase === "approving"}
                    approved={bridge.phase === "verified"}
                    headingLabel={approvalHeading}
                    persona={persona}
                  />
                </Reveal>
              ) : null}

              {(bridge.phase === "approving" ||
                bridge.phase === "verified" ||
                bridge.phase === "partial_error") &&
              bridge.approval ? (
                <Reveal delay={220}>
                  <StepProgress
                    results={bridge.approval.results}
                    steps={bridge.proposal?.plan?.steps}
                    persona={persona}
                    onRetry={() => void bridge.approve()}
                  />
                </Reveal>
              ) : null}

              {bridge.phase === "partial_error" && bridge.error ? (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground"
                >
                  {bridge.error}
                </div>
              ) : null}

              {bridge.phase === "verified" && bridge.approval ? (
                <>
                  {personaSectionOrder(persona).map((section, i) => {
                    const delay = 260 + i * 40;
                    switch (section) {
                      case "tax":
                        return (
                          <Reveal key="tax" delay={delay}>
                            <TaxSummaryCard
                              income={bridge.proposal!.payout.gross}
                              costs={feesTotal}
                              takeHome={bridge.proposal!.payout.net}
                            />
                          </Reveal>
                        );
                      case "clearing":
                        return (
                          <Reveal key="clearing" delay={delay}>
                            <div ref={clearingRef}>
                              <ClearingReconciliation
                                gross={bridge.proposal!.payout.gross}
                                feesTotal={feesTotal}
                                net={bridge.proposal!.payout.net}
                                clearingBalance={bridge.approval!.clearing_balance}
                                verified={bridge.approval!.verified}
                                persona={persona}
                              />
                            </div>
                          </Reveal>
                        );
                      case "pnl":
                        return (
                          <Reveal key="pnl" delay={delay}>
                            <PnLComparison
                              before={bridge.pnl?.before ?? null}
                              after={bridge.pnl?.after ?? null}
                              defaultOpen={persona === "owner"}
                              persona={persona}
                            />
                          </Reveal>
                        );
                      case "audit":
                        return (
                          <Reveal key="audit" delay={delay}>
                            <AuditTrail
                              entries={bridge.audit}
                              defaultOpen={persona === "bookkeeper"}
                              persona={persona}
                            />
                          </Reveal>
                        );
                      default:
                        return null;
                    }
                  })}
                  <Reveal delay={260 + personaSectionOrder(persona).length * 40}>
                    <EvidencePackCard fileHash={bridge.proposal!.file_hash} persona={persona} />
                  </Reveal>
                  {bridge.approval.attachment && bridge.approval.attachment.status === "success" ? (
                    <p className="inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
                      📎 Source CSV attached to invoice {bridge.approval.attachment.invoice_id}
                    </p>
                  ) : null}
                </>
              ) : null}
            </>
          )}

          <footer className="mt-auto pt-8 text-center text-xs text-muted-foreground">
            3 writes · zero-balance verification · every action auditable
          </footer>
        </div>
      </main>
    </>
  );
}
