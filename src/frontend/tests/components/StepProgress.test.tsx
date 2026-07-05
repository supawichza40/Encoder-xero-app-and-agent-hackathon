import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepProgress } from "@/components/StepProgress";
import type { PlanStep, StepResult } from "@/lib/payout-types";

const threeSteps: PlanStep[] = [
  { kind: "create-invoice", amount: "1340.00", account: null, lines: null, clears: null },
  { kind: "create-bank-transaction", amount: "493.00", account: null, lines: null, clears: null },
  { kind: "create-payment", amount: "847.00", account: null, lines: null, clears: null },
];

const fourSteps: PlanStep[] = [
  ...threeSteps.slice(0, 1),
  { kind: "create-credit-note", amount: "60.00", account: null, lines: null, clears: null },
  ...threeSteps.slice(1),
];

describe("StepProgress", () => {
  it("defaults to 3 total steps when no steps/totalSteps given", () => {
    render(<StepProgress results={[]} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("derives the total dynamically from the steps prop (4-step refund path)", () => {
    render(<StepProgress results={[]} steps={fourSteps} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("Credit note")).toBeInTheDocument();
  });

  it("shows 'Posting to Xero…' while incomplete", () => {
    const results: StepResult[] = [
      { step: 1, kind: "create-invoice", xero_id: "INV-1", status: "success" },
    ];
    render(<StepProgress results={results} steps={threeSteps} />);
    expect(screen.getByText(/posting to xero/i)).toBeInTheDocument();
  });

  it("shows 'Posted to Xero' once every step succeeds", () => {
    const results: StepResult[] = threeSteps.map((s, i) => ({
      step: i + 1,
      kind: s.kind,
      xero_id: `ID-${i}`,
      status: "success",
    }));
    render(<StepProgress results={results} steps={threeSteps} />);
    expect(screen.getByText(/^posted to xero$/i)).toBeInTheDocument();
    expect(screen.getByText("ID-0")).toBeInTheDocument();
  });

  it("shows a failure state when a step errors", () => {
    const results: StepResult[] = [
      { step: 1, kind: "create-invoice", xero_id: "INV-1", status: "success" },
      { step: 2, kind: "create-bank-transaction", xero_id: "", status: "error", message: "boom" },
    ];
    render(<StepProgress results={results} steps={threeSteps} />);
    expect(screen.getByText(/xero write failed/i)).toBeInTheDocument();
  });

  // GEN-4 — StepResult.message is rendered verbatim, with a persona-conditional
  // prefix, plus a working "Retry from this step" affordance.
  it("renders the failed step's message verbatim with an owner/bookkeeper prefix", () => {
    const results: StepResult[] = [
      { step: 1, kind: "create-invoice", xero_id: "INV-1", status: "success" },
      {
        step: 2,
        kind: "create-bank-transaction",
        xero_id: "",
        status: "error",
        message: "Xero rate limit exceeded",
      },
    ];
    render(<StepProgress results={results} steps={threeSteps} persona="owner" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Write 2 failed:");
    expect(alert).toHaveTextContent("Xero rate limit exceeded");
  });

  it("uses a plain-English prefix for freelancer, not 'Write N failed'", () => {
    const results: StepResult[] = [
      { step: 1, kind: "create-invoice", xero_id: "INV-1", status: "success" },
      {
        step: 2,
        kind: "create-bank-transaction",
        xero_id: "",
        status: "error",
        message: "Xero rate limit exceeded",
      },
    ];
    render(<StepProgress results={results} steps={threeSteps} persona="freelancer" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("That step didn't go through:");
    expect(alert).not.toHaveTextContent(/write 2 failed/i);
  });

  it("calls onRetry when 'Retry from this step' is clicked", async () => {
    const onRetry = vi.fn();
    const results: StepResult[] = [
      { step: 1, kind: "create-invoice", xero_id: "INV-1", status: "success" },
      { step: 2, kind: "create-bank-transaction", xero_id: "", status: "error", message: "boom" },
    ];
    render(<StepProgress results={results} steps={threeSteps} onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: /retry from this step/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("omits the retry button when no onRetry handler is given", () => {
    const results: StepResult[] = [
      { step: 1, kind: "create-invoice", xero_id: "INV-1", status: "success" },
      { step: 2, kind: "create-bank-transaction", xero_id: "", status: "error", message: "boom" },
    ];
    render(<StepProgress results={results} steps={threeSteps} />);
    expect(screen.queryByRole("button", { name: /retry from this step/i })).not.toBeInTheDocument();
  });
});
