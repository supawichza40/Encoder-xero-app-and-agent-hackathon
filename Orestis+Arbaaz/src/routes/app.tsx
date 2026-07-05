import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/motion";
import { Navbar } from "@/components/Navbar";

import { usePayoutBridge } from "@/lib/usePayoutBridge";
import { useDemoAuth } from "@/lib/useDemoAuth";
import { FileUpload } from "@/components/FileUpload";
import { ApprovalDrawer } from "@/components/ApprovalDrawer";
import { IdempotencyBanner } from "@/components/IdempotencyBanner";
import { StepProgress } from "@/components/StepProgress";
import { ClearingReconciliation } from "@/components/ClearingReconciliation";
import { PnLComparison } from "@/components/PnLComparison";
import { AuditTrail } from "@/components/AuditTrail";
import {
  InvoiceHistory,
  saveHistoryEntry,
  type HistoryEntry,
} from "@/components/InvoiceHistory";
import { InvoiceDetails } from "@/components/InvoiceDetails";

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
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const savedHashRef = useRef<string | null>(null);

  useEffect(() => {
    if (bridge.phase === "verified" && clearingRef.current) {
      clearingRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [bridge.phase]);

  // Persist a history entry when a fresh proposal arrives.
  useEffect(() => {
    if (
      bridge.proposal &&
      lastFileName &&
      savedHashRef.current !== bridge.proposal.file_hash
    ) {
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
    setSelected(null);
    void bridge.uploadFile(f);
  };

  const uploadDisabled =
    bridge.phase === "uploading" ||
    bridge.phase === "proposed" ||
    bridge.phase === "approving" ||
    bridge.phase === "idempotent";

  const feesTotal = bridge.proposal
    ? (Number(bridge.proposal.payout.commission) + Number(bridge.proposal.payout.fees)).toFixed(2)
    : "0.00";

  const approvalHeading =
    persona === "bookkeeper"
      ? "Writes with Xero IDs"
      : persona === "freelancer"
        ? "What we'll record"
        : "What Xero will do";

  return (
    <>
      <Navbar />
      <main className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-6 overflow-hidden px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[260px_1fr]">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/3 h-64 w-64 rounded-full bg-primary/8 blur-3xl animate-glow-pulse"
        />
        <Reveal className="lg:sticky lg:top-6 lg:self-start" delay={0}>
          <InvoiceHistory
            selectedId={selected?.id ?? null}
            onSelect={(e) => setSelected(e)}
          />
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

              {bridge.phase === "idempotent" && bridge.proposal?.existing_ids ? (
                <Reveal delay={160}>
                <IdempotencyBanner
                  existingIds={bridge.proposal.existing_ids}
                  onReset={bridge.reset}
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
                  <Reveal delay={260}>
                  <div ref={clearingRef}>
                    <ClearingReconciliation
                      gross={bridge.proposal!.payout.gross}
                      feesTotal={feesTotal}
                      net={bridge.proposal!.payout.net}
                      clearingBalance={bridge.approval.clearing_balance}
                      verified={bridge.approval.verified}
                    />
                  </div>
                  </Reveal>
                  <Reveal delay={300}>
                    <PnLComparison before={bridge.pnl?.before ?? null} after={bridge.pnl?.after ?? null} />
                  </Reveal>
                  <Reveal delay={340}>
                    <AuditTrail entries={bridge.audit} defaultOpen={persona === "bookkeeper"} />
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
