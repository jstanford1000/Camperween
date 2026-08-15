"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateOrderNote } from "@/app/actions"

export function AdminOrderNote({ orderId, note }: { orderId: string; note: string | null }) {
  const router = useRouter()
  const [value, setValue] = useState(note ?? "")
  const [saving, setSaving] = useState(false)
  const dirty = value !== (note ?? "")

  async function handleSave() {
    setSaving(true)
    try {
      await updateOrderNote(orderId, value)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1">
      <span className="label">Admin note (refunds, cancellations, etc.)</span>
      <textarea
        className="input"
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. Refunded $50 to Jane for cancelling Sunday night"
      />
      {dirty && (
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-md bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5"
        >
          {saving ? "Saving..." : "Save note"}
        </button>
      )}
    </div>
  )
}
