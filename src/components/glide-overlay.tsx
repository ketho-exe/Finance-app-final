"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function GlideOverlay({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close overlay" onClick={onClose} className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-border bg-panel shadow-2xl animate-[glideIn_180ms_ease-out]">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-xl font-black">{title}</h2>
          <button type="button" title="Close" onClick={onClose} className="grid size-9 place-items-center rounded-md border border-border">
            <X className="size-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}
