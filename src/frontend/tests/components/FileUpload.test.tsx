import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUpload } from "@/components/FileUpload";

function csvFile(name = "payout.csv") {
  return new File(["a,b,c"], name, { type: "text/csv" });
}

describe("FileUpload", () => {
  it("renders the dropzone with default copy", () => {
    render(<FileUpload onFileSelected={vi.fn()} />);
    expect(screen.getByText(/drop marketplace csv here/i)).toBeInTheDocument();
  });

  it("selects a csv file via the hidden input and forwards it unchanged", async () => {
    const onFileSelected = vi.fn();
    render(<FileUpload onFileSelected={onFileSelected} />);
    const file = csvFile();
    const input = screen.getByLabelText(/upload marketplace payout csv file/i).querySelector("input")!;
    await userEvent.upload(input, file);
    expect(onFileSelected).toHaveBeenCalledTimes(1);
    expect(onFileSelected.mock.calls[0][0]).toBe(file);
  });

  it("forwards a non-csv file unchanged (does not silently zero it out)", () => {
    const onFileSelected = vi.fn();
    render(<FileUpload onFileSelected={onFileSelected} />);
    const badFile = new File(["not a csv"], "notes.txt", { type: "text/plain" });
    const input: HTMLInputElement = screen
      .getByLabelText(/upload marketplace payout csv file/i)
      .querySelector("input")!;
    // fireEvent bypasses user-event's `accept`-attribute filtering, which
    // would otherwise refuse to even fire the change event for a mismatched
    // file type — we need the change to fire so the component's own
    // validation (or lack thereof) is what's under test.
    Object.defineProperty(input, "files", { value: [badFile] });
    fireEvent.change(input);
    expect(onFileSelected).toHaveBeenCalledTimes(1);
    const forwarded = onFileSelected.mock.calls[0][0] as File;
    // Regression guard: previously this substituted a zero-byte File, which
    // defeated the parent's `file.size > 0` extension check and let invalid
    // files silently pass through as if they were valid CSVs.
    expect(forwarded.name).toBe("notes.txt");
    expect(forwarded.size).toBeGreaterThan(0);
  });

  it("handles drag-and-drop", () => {
    const onFileSelected = vi.fn();
    render(<FileUpload onFileSelected={onFileSelected} />);
    const dropzone = screen.getByRole("button", { name: /upload marketplace payout csv file/i });
    const file = csvFile();
    fireEvent.dragOver(dropzone);
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it("does not accept drops or clicks while disabled", () => {
    const onFileSelected = vi.fn();
    render(<FileUpload onFileSelected={onFileSelected} disabled />);
    const dropzone = screen.getByRole("button", { name: /upload marketplace payout csv file/i });
    expect(dropzone).toHaveAttribute("aria-disabled", "true");
    fireEvent.drop(dropzone, { dataTransfer: { files: [csvFile()] } });
    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it("shows a loading spinner state while parsing", () => {
    render(<FileUpload onFileSelected={vi.fn()} loading />);
    expect(screen.getByText(/parsing statement/i)).toBeInTheDocument();
  });

  it("shows an inline error message", () => {
    render(<FileUpload onFileSelected={vi.fn()} error="Please upload a .csv file." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Please upload a .csv file.");
  });

  it("renders the compact 'Add another' variant once a proposal exists", () => {
    render(<FileUpload onFileSelected={vi.fn()} compact />);
    expect(screen.getByText(/add another/i)).toBeInTheDocument();
  });

  it("compact variant shows its own loading and error states", () => {
    const { rerender } = render(<FileUpload onFileSelected={vi.fn()} compact loading />);
    expect(screen.getByText(/parsing statement/i)).toBeInTheDocument();
    rerender(<FileUpload onFileSelected={vi.fn()} compact error="bad file" />);
    expect(screen.getByRole("alert")).toHaveTextContent("bad file");
  });
});
