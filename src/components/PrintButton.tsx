"use client"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-black text-white px-4 py-2 text-sm"
    >
      Print
    </button>
  )
}
