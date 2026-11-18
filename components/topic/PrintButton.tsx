"use client";

import { PageIcon } from "@/components/ui/PageIcon";

/** Opens the browser's print dialog; the print stylesheet lays the sheets
    out on A4. */
export function PrintButton() {
  return (
    <button
      type="button"
      className="tt-btn tt-btn-sm tt-btn-primary"
      onClick={() => window.print()}
    >
      <PageIcon name="printer" />
      Print A4
    </button>
  );
}
