import type { PricingContent } from "./content"

export type TicketTypeId = string

export interface AttendeeInput {
  ticketType: TicketTypeId
  sundayNightAddOn: boolean
  alcoholAddOn: boolean
}

export function findTicketType(pricing: PricingContent, id: TicketTypeId) {
  const ticket = pricing.ticketTypes.find((t) => t.id === id)
  if (!ticket) throw new Error(`Unknown ticket type: ${id}`)
  return ticket
}

export function calculateAttendeePrice(attendee: AttendeeInput, pricing: PricingContent): number {
  const base = findTicketType(pricing, attendee.ticketType).price
  const sundayNight = pricing.addOns.find((a) => a.id === "sundayNight")?.price ?? 0
  const alcohol = pricing.addOns.find((a) => a.id === "alcohol")?.price ?? 0
  const addOns = (attendee.sundayNightAddOn ? sundayNight : 0) + (attendee.alcoholAddOn ? alcohol : 0)
  return base + addOns
}

export function calculateOrderTotal(attendees: AttendeeInput[], pricing: PricingContent): number {
  return attendees.reduce((sum, a) => sum + calculateAttendeePrice(a, pricing), 0)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}
