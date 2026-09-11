"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateOrderDiscount } from "@/app/actions"

export function AdminOrderDiscount({
  orderId,
  discountAmount,
}: {
  orderId: string
  discountAmount: number
}) {
  const router = useRouter()
  const [value, setValue] = useState(String(discountAmount || ""))
  const [saving, setSaving] = useState(false)
  const dirty = value !== String(discountAmount || "")

  async function handleSave() {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0) {
      window.alert("Discount must be a non-negative number")
      return
    }
    setSaving(true)
    try {
      await updateOrderDiscount(orderId, parsed)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1">
      <span className="label">Discount ($)</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step="0.01"
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0"
        />
        {dirty && (
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-md bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 whitespace-nowrap"
          >
            {saving ? "Saving..." : "Save discount"}
          </button>
        )}
      </div>
    </div>
  )
}
