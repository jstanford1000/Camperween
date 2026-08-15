"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createOrder, type AttendeeFormData, type OrderFormData } from "@/app/actions"
import type { LabelsContent, PricingContent } from "@/lib/content"
import { calculateAttendeePrice, calculateOrderTotal, formatCurrency } from "@/lib/pricing"
import { EVENT_DATE_RANGE, EVENT_LOCATION, EVENT_NAME } from "@/lib/config"
import { AttendeeForm } from "./AttendeeForm"

function todayDateString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function emptyAttendee(defaultTicketType: string): AttendeeFormData {
  return {
    firstName: "",
    lastName: "",
    email: "",
    ageCategory: "",
    ticketType: defaultTicketType,
    roommatePreference: "",
    dietaryRestrictions: "",
    phone: "",
    specialAccommodations: "",
    volunteerTasks: [],
    sundayNightAddOn: false,
    alcoholAddOn: false,
  }
}

interface Props {
  pricing: PricingContent
  labels: LabelsContent
}

export function OrderForm({ pricing, labels }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [purchaserFirstName, setPurchaserFirstName] = useState("")
  const [purchaserLastName, setPurchaserLastName] = useState("")
  const [purchaserEmail, setPurchaserEmail] = useState("")
  const [purchaserPhone, setPurchaserPhone] = useState("")
  const [arrivalExpectation, setArrivalExpectation] = useState("")
  const [emergencyContactName, setEmergencyContactName] = useState("")
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("")
  const [liabilitySignatureName, setLiabilitySignatureName] = useState("")
  const liabilitySignatureDate = todayDateString()
  const [waiverAgreed, setWaiverAgreed] = useState(false)
  const [parentGuardianWaiver, setParentGuardianWaiver] = useState(false)
  const [comments, setComments] = useState("")

  const [attendees, setAttendees] = useState<AttendeeFormData[]>([emptyAttendee("")])
  const [attendee1SameAsPrimary, setAttendee1SameAsPrimary] = useState(true)

  function updateAttendee(index: number, next: AttendeeFormData) {
    setAttendees((prev) => prev.map((a, i) => (i === index ? next : a)))
  }

  function toggleAttendee1SameAsPrimary(checked: boolean) {
    if (!checked) {
      // Freeze the current primary-contact values into attendee 1 so they
      // don't disappear when the fields become independently editable.
      setAttendees((prev) =>
        prev.map((a, i) =>
          i === 0
            ? {
                ...a,
                firstName: purchaserFirstName,
                lastName: purchaserLastName,
                email: purchaserEmail,
                phone: purchaserPhone,
              }
            : a
        )
      )
    }
    setAttendee1SameAsPrimary(checked)
  }

  const effectiveAttendees = attendees.map((a, i) =>
    i === 0 && attendee1SameAsPrimary
      ? {
          ...a,
          firstName: purchaserFirstName,
          lastName: purchaserLastName,
          email: purchaserEmail,
          phone: purchaserPhone,
        }
      : a
  )

  function addAttendee() {
    setAttendees((prev) => [...prev, emptyAttendee(prev[0]?.ticketType ?? "")])
  }

  function removeAttendee(index: number) {
    setAttendees((prev) => prev.filter((_, i) => i !== index))
  }

  const total = calculateOrderTotal(effectiveAttendees, pricing)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!waiverAgreed) {
      setError("You must agree to the accident waiver and release of liability.")
      return
    }
    if (effectiveAttendees.some((a) => !a.ageCategory)) {
      setError("Please select an age category for every attendee.")
      return
    }
    if (effectiveAttendees.some((a) => !a.ticketType)) {
      setError("Please select a housing type for every attendee.")
      return
    }

    const data: OrderFormData = {
      purchaserFirstName,
      purchaserLastName,
      purchaserEmail,
      purchaserPhone,
      arrivalExpectation,
      emergencyContactName,
      emergencyContactPhone,
      liabilitySignatureName,
      liabilitySignatureDate,
      parentGuardianWaiver,
      comments,
      attendees: effectiveAttendees,
    }

    setSubmitting(true)
    try {
      const orderId = await createOrder(data)
      router.push(`/confirmation/${orderId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  const g = labels.groupInfo
  const w = labels.waiver
  const c = labels.comments
  const o = labels.orderSummary

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
      <div className="space-y-8">
        <section className="rounded-lg border border-neutral-700 bg-neutral-900 p-5 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-100">{g.sectionTitle}</h2>

          <div className="space-y-4 border border-neutral-800 rounded-md p-4 bg-neutral-950/40">
            <h3 className="text-base font-semibold text-neutral-200">
              {g.primaryContact.sectionTitle}
            </h3>
            <p className="text-sm text-neutral-400">{g.primaryContact.subtitle}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={g.primaryContact.firstName} required>
                <input required className="input" value={purchaserFirstName} onChange={(e) => setPurchaserFirstName(e.target.value)} />
              </Field>
              <Field label={g.primaryContact.lastName} required>
                <input required className="input" value={purchaserLastName} onChange={(e) => setPurchaserLastName(e.target.value)} />
              </Field>
              <Field label={g.primaryContact.email} required>
                <input type="email" required className="input" value={purchaserEmail} onChange={(e) => setPurchaserEmail(e.target.value)} />
              </Field>
              <Field label={g.primaryContact.phone} required>
                <input required className="input" value={purchaserPhone} onChange={(e) => setPurchaserPhone(e.target.value)} />
              </Field>
            </div>
          </div>

          <Field label={g.arrivalExpectation} required>
            <input required className="input" placeholder="e.g. Friday evening" value={arrivalExpectation} onChange={(e) => setArrivalExpectation(e.target.value)} />
          </Field>
          <Field label={g.emergencyContactName} required>
            <input required className="input" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
          </Field>
          <Field label={g.emergencyContactPhone} required>
            <input required className="input" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
          </Field>
        </section>

        <section className="rounded-lg border border-neutral-700 bg-neutral-900 p-5 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-100">{w.sectionTitle}</h2>
          <p className="text-sm text-neutral-400">
            {EVENT_NAME}, {EVENT_DATE_RANGE}, {EVENT_LOCATION}
          </p>
          <div className="text-sm text-neutral-300 space-y-3 max-h-56 overflow-y-auto pr-1 border border-neutral-800 rounded-md p-3 bg-neutral-950">
            {w.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-1" checked={waiverAgreed} onChange={(e) => setWaiverAgreed(e.target.checked)} />
            <span className="text-sm text-neutral-300">
              {w.agreeCheckbox} <span className="text-red-400">*</span>
            </span>
          </label>
          <Field label={w.signatureName} required>
            <input required className="input" value={liabilitySignatureName} onChange={(e) => setLiabilitySignatureName(e.target.value)} />
          </Field>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-1" checked={parentGuardianWaiver} onChange={(e) => setParentGuardianWaiver(e.target.checked)} />
            <span className="text-sm text-neutral-300">{w.parentGuardianWaiver}</span>
          </label>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-100">{labels.attendees.sectionTitle}</h2>
          {effectiveAttendees.map((attendee, i) => (
            <AttendeeForm
              key={i}
              index={i}
              attendee={attendee}
              onChange={updateAttendee}
              onRemove={removeAttendee}
              canRemove={attendees.length > 1}
              pricing={pricing}
              labels={labels}
              firstAttendeeRoommatePreference={effectiveAttendees[0]?.roommatePreference}
              sameAsPrimaryContact={i === 0 ? attendee1SameAsPrimary : undefined}
              onToggleSameAsPrimaryContact={i === 0 ? toggleAttendee1SameAsPrimary : undefined}
            />
          ))}
          <button
            type="button"
            onClick={addAttendee}
            className="w-full rounded-md border-2 border-amber-600 bg-amber-500/10 py-3 text-amber-400 font-semibold text-base hover:bg-amber-500/20 hover:border-amber-500 transition-colors cursor-pointer"
          >
            {labels.attendees.addAttendeeButton}
          </button>
        </section>

        <section className="rounded-lg border border-neutral-700 bg-neutral-900 p-5 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-100">{c.sectionTitle}</h2>
          <textarea className="input" rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
        </section>
      </div>

      <aside className="lg:sticky lg:top-6 h-fit space-y-4">
        <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-5 space-y-3">
          <h2 className="text-lg font-semibold text-neutral-100">{o.sectionTitle}</h2>
          <div className="space-y-2">
            {effectiveAttendees.map((a, i) => (
              <div key={i} className="flex justify-between text-sm text-neutral-300">
                <span>
                  Attendee {i + 1}{a.firstName ? ` (${a.firstName})` : ""}
                </span>
                <span>{formatCurrency(calculateAttendeePrice(a, pricing))}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-700 pt-3 flex justify-between font-semibold text-neutral-100">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {error && (
            <p className="text-sm text-red-400 border border-red-900 bg-red-950/40 rounded-md p-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold py-2.5"
          >
            {submitting ? "Submitting..." : o.submitButton}
          </button>
          <p className="text-xs text-neutral-500">{o.submitNote}</p>
        </div>
      </aside>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required && <span className="text-red-400">&nbsp;*</span>}
      </span>
      {children}
    </label>
  )
}
