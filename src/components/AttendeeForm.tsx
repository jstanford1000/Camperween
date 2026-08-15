"use client"

import type { LabelsContent, PricingContent } from "@/lib/content"
import { calculateAttendeePrice, findTicketType, formatCurrency } from "@/lib/pricing"
import { renderBoldText } from "@/lib/richText"
import type { AttendeeFormData } from "@/app/actions"

interface Props {
  index: number
  attendee: AttendeeFormData
  onChange: (index: number, next: AttendeeFormData) => void
  onRemove: (index: number) => void
  canRemove: boolean
  pricing: PricingContent
  labels: LabelsContent
  firstAttendeeRoommatePreference?: string
  sameAsPrimaryContact?: boolean
  onToggleSameAsPrimaryContact?: (checked: boolean) => void
}

export function AttendeeForm({
  index,
  attendee,
  onChange,
  onRemove,
  canRemove,
  pricing,
  labels,
  firstAttendeeRoommatePreference,
  sameAsPrimaryContact,
  onToggleSameAsPrimaryContact,
}: Props) {
  const t = labels.attendees

  function update<K extends keyof AttendeeFormData>(key: K, value: AttendeeFormData[K]) {
    onChange(index, { ...attendee, [key]: value })
  }

  function toggleVolunteerTask(task: string) {
    const has = attendee.volunteerTasks.includes(task)
    update(
      "volunteerTasks",
      has
        ? attendee.volunteerTasks.filter((tk) => tk !== task)
        : [...attendee.volunteerTasks, task]
    )
  }

  const ticketDef = attendee.ticketType ? findTicketType(pricing, attendee.ticketType) : null
  const price = calculateAttendeePrice(attendee, pricing)
  const sundayAddOn = pricing.addOns.find((a) => a.id === "sundayNight")
  const alcoholAddOn = pricing.addOns.find((a) => a.id === "alcohol")

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-100">
          Attendee {index + 1}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-amber-400 font-medium">
            {formatCurrency(price)}
          </span>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-sm text-neutral-400 hover:text-red-400"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {onToggleSameAsPrimaryContact && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={sameAsPrimaryContact ?? false}
            onChange={(e) => onToggleSameAsPrimaryContact(e.target.checked)}
          />
          <span className="text-sm text-neutral-300">{t.sameAsPrimaryContact}</span>
        </label>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t.firstName} required>
          <input
            required
            disabled={sameAsPrimaryContact}
            className="input disabled:opacity-60 disabled:cursor-not-allowed"
            value={attendee.firstName}
            onChange={(e) => update("firstName", e.target.value)}
          />
        </Field>
        <Field label={t.lastName} required>
          <input
            required
            disabled={sameAsPrimaryContact}
            className="input disabled:opacity-60 disabled:cursor-not-allowed"
            value={attendee.lastName}
            onChange={(e) => update("lastName", e.target.value)}
          />
        </Field>
        <Field label={t.email} required>
          <input
            type="email"
            required
            disabled={sameAsPrimaryContact}
            className="input disabled:opacity-60 disabled:cursor-not-allowed"
            value={attendee.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </Field>
        <Field label={t.phone} required>
          <input
            required
            disabled={sameAsPrimaryContact}
            className="input disabled:opacity-60 disabled:cursor-not-allowed"
            value={attendee.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </Field>
        <Field label={t.ageCategory} required>
          <select
            required
            className="input"
            value={attendee.ageCategory}
            onChange={(e) => update("ageCategory", e.target.value)}
          >
            <option value="" disabled>
              Select one
            </option>
            {labels.ageCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="subtitle mb-1">
          {t.registrationType} <span className="text-red-400">*</span>
        </legend>
        <p className="text-sm text-neutral-400 mb-3 whitespace-pre-line">
          {renderBoldText(t.registrationTypeDescription)}
        </p>
        <div className="space-y-2">
          {pricing.ticketTypes.map((ticket) => (
            <label
              key={ticket.id}
              className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer ${
                attendee.ticketType === ticket.id
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-neutral-700 hover:border-neutral-600"
              }`}
            >
              <input
                type="radio"
                name={`ticketType-${index}`}
                className="mt-1"
                checked={attendee.ticketType === ticket.id}
                onChange={() => update("ticketType", ticket.id)}
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium text-neutral-100">{ticket.label}</span>
                  <span className="text-neutral-300">
                    {ticket.price === 0 ? "Free" : formatCurrency(ticket.price)}
                  </span>
                </div>
                <p className="text-sm text-neutral-400">{ticket.description}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="pt-2 pb-1">
        <h4 className="subtitle mb-3">{t.addOnsSubtitle}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sundayAddOn && (
            <label className="flex items-start gap-3 rounded-md border border-neutral-700 p-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={attendee.sundayNightAddOn}
                onChange={(e) => update("sundayNightAddOn", e.target.checked)}
              />
              <div>
                <div className="font-medium text-neutral-100">
                  {sundayAddOn.label} (+{formatCurrency(sundayAddOn.price)})
                </div>
                <p className="text-sm text-neutral-400">{sundayAddOn.description}</p>
              </div>
            </label>
          )}
          {alcoholAddOn && (
            <label className="flex items-start gap-3 rounded-md border border-neutral-700 p-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={attendee.alcoholAddOn}
                onChange={(e) => update("alcoholAddOn", e.target.checked)}
              />
              <div>
                <div className="font-medium text-neutral-100">
                  {alcoholAddOn.label} (+{formatCurrency(alcoholAddOn.price)})
                </div>
                <p className="text-sm text-neutral-400">{alcoholAddOn.description}</p>
              </div>
            </label>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="subtitle">{t.attendeeInfoSubtitle}</h4>
        {ticketDef?.allowsRoommatePreference && (
          <Field label={t.roommatePreference}>
            {index > 0 && firstAttendeeRoommatePreference?.trim() && (
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attendee.roommatePreference === firstAttendeeRoommatePreference}
                  onChange={(e) =>
                    update(
                      "roommatePreference",
                      e.target.checked ? firstAttendeeRoommatePreference : ""
                    )
                  }
                />
                <span className="text-sm text-neutral-300">{t.sameRoommatesAsFirst}</span>
              </label>
            )}
            <textarea
              className="input"
              rows={2}
              value={attendee.roommatePreference}
              onChange={(e) => update("roommatePreference", e.target.value)}
            />
          </Field>
        )}
        <Field label={t.dietaryRestrictions}>
          <textarea
            className="input"
            rows={2}
            value={attendee.dietaryRestrictions}
            onChange={(e) => update("dietaryRestrictions", e.target.value)}
          />
        </Field>
        <Field label={t.specialAccommodations}>
          <textarea
            className="input"
            rows={2}
            value={attendee.specialAccommodations}
            onChange={(e) => update("specialAccommodations", e.target.value)}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="label mb-2">{t.volunteerTasksTitle}</legend>
        <p className="text-sm text-neutral-400 mb-2">{t.volunteerTasksDescription}</p>
        <div className="space-y-2">
          {labels.volunteerTasks.map((task) => (
            <label key={task} className="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={attendee.volunteerTasks.includes(task)}
                onChange={() => toggleVolunteerTask(task)}
              />
              <span className="text-neutral-300">{task}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
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
