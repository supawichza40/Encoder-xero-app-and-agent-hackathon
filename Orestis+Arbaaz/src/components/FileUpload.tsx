import { useCallback, useRef, useState } from "react";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
}

export function FileUpload({ onFileSelected, disabled, loading, error }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.name.toLowerCase().endsWith(".csv")) {
        onFileSelected(new File([], file.name)); // parent decides — but validate here
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const busy = disabled || loading;

  return (
    <section aria-labelledby="upload-heading" className="w-full">
      <h2 id="upload-heading" className="sr-only">
        Upload marketplace payout CSV
      </h2>
      <div
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-disabled={busy}
        aria-label="Upload marketplace payout CSV file"
        onDragOver={(e) => {
          if (busy) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (busy) return;
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (busy) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          dragging && !busy
            ? "border-primary bg-primary/10"
            : "border-border bg-card hover:border-primary/60",
          busy && "cursor-not-allowed opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          disabled={busy}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {loading ? (
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        ) : (
          <Upload className="size-8 text-muted-foreground" aria-hidden />
        )}
        <div>
          <p className="text-base font-medium text-foreground">
            {loading ? "Parsing statement…" : "Drop marketplace CSV here"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            or click to choose a file — CSV only
          </p>
        </div>
      </div>
      {error ? (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}
    </section>
  );
}
