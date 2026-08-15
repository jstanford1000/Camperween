"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { removeAttendeeFromOrder, updateAttendee } from "@/app/actions"
import type { LabelsContent, PricingContent } from "@/lib/content"
import { calculateAttendeePrice, findTicketType, formatCurrency } from "@/lib/pricing"

interface AttendeeRow {
  id: string
  firstName: string
  lastName: string
  email: string | null
  ageCategory: string
  ticketType: string
  price: number
  roommatePreference: string | null
  dietaryRestrictions: string | null
  phone: string | null
  specialAccommodations: string | null
  volunteerTasks: string | null
  sundayNightAddOn: boolean
  alcoholAddOn: boolean
}

interface EditState {
  firstName: string
  lastName: string
  email: string
  phone: string
  ageCategory: string
  ticketType: string
  price: number
  roommatePreference: string
  dietaryRestrictions: string
  specialAccommodations: string
  sundayNightAddOn: boolean
  alcoholAddOn: boolean
}

function toEditState(a: AttendeeRow): EditState {
  return {
    firstName: a.firstName,
    lastName: a.lastName,
    email: a.email ?? "",
    phone: a.phone ?? "",
    ageCategory: a.ageCategory,
    ticketType: a.ticketType,
    price: a.price,
    roommatePreference: a.roommatePreference ?? "",
    dietaryRestrictions: a.dietaryRestrictions ?? "",
    specialAccommodations: a.specialAccommodations ?? "",
    sundayNightAddOn: a.sundayNightAddOn,
    alcoholAddOn: a.alcoholAddOn,
  }
}

export function AdminAttendeeCard({
  attendee,
  pricing,
  labels,
}: {
  attendee: AttendeeRow
  pricing: PricingContent
  labels: LabelsContent
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EditState>(() => toEditState(attendee))

  function startEdit() {
    setForm(toEditState(attendee))
    setEditing(true)
  }

  function update<K extends keyof EditState>(key: K, value: EditState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === "ticketType" || key === "sundayNightAddOn" || key === "alcoholAddOn") {
        next.price = calculateAttendeePrice(next, pricing)
      }
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateAttendee(attendee.id, form)
      router.refresh()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    if (!window.confirm(`Remove ${attendee.firstName} ${attendee.lastName} from this order?`)) {
      return
    }
    setSaving(true)
    try {
      await removeAttendeeFromOrder(attendee.id)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="rounded-md border border-amber-600 bg-neutral-950 p-3 text-sm space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input"
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
          />
          <input
            className="input"
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
          />
          <input
            className="input"
            placeholder="Email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          <input
            className="input"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>

        <select
          className="input"
          value={form.ageCategory}
          onChange={(e) => update("ageCategory", e.target.value)}
        >
          {labels.ageCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={form.ticketType}
          onChange={(e) => update("ticketType", e.target.value)}
        >
          {pricing.ticketTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label} ({formatCurrency(t.price)})
            </option>
          ))}
        </select>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.sundayNightAddOn}
              onChange={(e) => update("sundayNightAddOn", e.target.checked)}
            />
            <span className="text-neutral-300">Sunday night add-on</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.alcoholAddOn}
              onChange={(e) => update("alcoholAddOn", e.target.checked)}
            />
            <span className="text-neutral-300">Alcohol add-on</span>
          </label>
        </div>

        <textarea
          className="input"
          rows={2}
          placeholder="Roommate preference"
          value={form.roommatePreference}
          onChange={(e) => update("roommatePreference", e.target.value)}
        />
        <textarea
          className="input"
          rows={2}
          placeholder="Dietary restrictions"
          value={form.dietaryRestrictions}
          onChange={(e) => update("dietaryRestrictions", e.target.value)}
        />
        <textarea
          className="input"
          rows={2}
          placeholder="Special accommodations"
          value={form.specialAccommodations}
          onChange={(e) => update("specialAccommodations", e.target.value)}
        />

        <label className="block">
          <span className="label">Price (what this person owes)</span>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.price}
            onChange={(e) => update("price", Number(e.target.value))}
          />
        </label>
        <p className="text-xs text-neutral-500">
          Price auto-fills from the housing type and add-ons above, but you can type over it to
          give a partial refund or custom amount.
        </p>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-md bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => setEditing(false)}
            className="rounded-md border border-neutral-600 text-neutral-200 text-sm px-3 py-1.5 hover:border-neutral-400"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-950 p-3 text-sm space-y-1">
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-neutral-100">
          {attendee.firstName} {attendee.lastName} &middot;{" "}
          {findTicketType(pricing, attendee.ticketType).label}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={startEdit}
            className="text-xs text-neutral-400 hover:text-amber-400"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleRemove}
            className="text-xs text-neutral-400 hover:text-red-400 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="text-neutral-400">Age: {attendee.ageCategory}</div>
      {attendee.email && (
        <div className="text-neutral-400">
          Email:{" "}
          <a href={`mailto:${attendee.email}`} className="hover:text-amber-400 hover:underline">
            {attendee.email}
          </a>
        </div>
      )}
      {attendee.phone && <div className="text-neutral-400">Phone: {attendee.phone}</div>}
      {attendee.roommatePreference && (
        <div className="text-neutral-400">Roommates: {attendee.roommatePreference}</div>
      )}
      {attendee.dietaryRestrictions && (
        <div className="text-neutral-400">Diet: {attendee.dietaryRestrictions}</div>
      )}
      {attendee.specialAccommodations && (
        <div className="text-neutral-400">Accommodations: {attendee.specialAccommodations}</div>
      )}
      <div className="text-neutral-400">
        Add-ons:{" "}
        {[attendee.sundayNightAddOn && "Sunday night", attendee.alcoholAddOn && "Alcohol"]
          .filter(Boolean)
          .join(", ") || "None"}
      </div>
      {attendee.volunteerTasks && JSON.parse(attendee.volunteerTasks).length > 0 && (
        <div className="text-neutral-400">
          Volunteer: {JSON.parse(attendee.volunteerTasks).length} task(s) selected
        </div>
      )}
      <div className="text-amber-400 font-medium">{formatCurrency(attendee.price)}</div>
    </div>
  )
}
