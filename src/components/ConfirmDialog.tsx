import React, { useEffect } from "react";
import Button from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = "Er du sikker?",
  description,
  confirmLabel = "Bekreft",
  cancelLabel = "Avbryt",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />

      {/* card */}
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h3 id="confirm-title" className="text-lg font-semibold text-white">
            {title}
          </h3>
          <Button
            style="exit"
            size="small-square"
            onClick={onCancel}
            aria-label="Lukk"
          >
            <i className="fa-solid fa-xmark" />
          </Button>
        </div>

        {description && (
          <div className="mt-2 text-sm text-neutral-300">{description}</div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onCancel} disabled={loading} style="secondary">
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? <i className="fa-solid fa-spinner fa-spin" /> : null}{" "}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
