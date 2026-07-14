import { AlertTriangle, X } from "lucide-react";

import Button from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  dangerous?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  dangerous = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[90]
        flex
        items-center
        justify-center
        bg-black/75
        p-4
        backdrop-blur-sm
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={loading ? undefined : onCancel}
        aria-label="Dialog schliessen"
      />

      <div
        className="
          scale-enter
          relative
          z-10
          w-full
          max-w-lg
          overflow-hidden
          rounded-3xl
          border
          border-zinc-800
          bg-zinc-950
          shadow-2xl
        "
      >
        <div className="flex items-start gap-4 p-6 sm:p-7">
          <div
            className={`
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-2xl
              ${
                dangerous
                  ? "bg-red-500/10 text-red-400"
                  : "bg-yellow-400/10 text-yellow-400"
              }
            `}
          >
            <AlertTriangle size={24} />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-xl font-black sm:text-2xl"
            >
              {title}
            </h2>

            <p className="mt-2 leading-7 text-zinc-400">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-zinc-500
              transition
              hover:bg-zinc-900
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label="Dialog schliessen"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="
            flex
            flex-col-reverse
            gap-3
            border-t
            border-zinc-800
            bg-black/20
            p-5
            sm:flex-row
            sm:justify-end
          "
        >
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={dangerous ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}