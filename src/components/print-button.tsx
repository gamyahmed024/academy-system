"use client";

export function PrintButton() {
  return (
    <button className="btn-outline" onClick={() => window.print()}>
      طباعة / حفظ PDF
    </button>
  );
}
