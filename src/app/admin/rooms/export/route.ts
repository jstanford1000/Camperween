import { NextResponse } from "next/server"
import { getAllOrders, isAdminAuthed } from "@/app/actions"
import { getPricingContent, getRoomsContent } from "@/lib/content"
import { findTicketType } from "@/lib/pricing"
import { csvRow } from "@/lib/csv"
import { ROOM_ELIGIBLE_TICKET_TYPES, resolvePlacements, type AttendeeWithAssignment } from "@/lib/roomAssignment"

export async function GET() {
  if (!(await isAdminAuthed())) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const pricing = getPricingContent()
  const roomsConfig = getRoomsContent()
  const orders = await getAllOrders()

  function ticketLabel(ticketType: string) {
    try {
      return findTicketType(pricing, ticketType).label
    } catch {
      return ticketType
    }
  }

  const attendees: AttendeeWithAssignment[] = orders.flatMap((order) =>
    order.attendees.map((a) => ({
      id: a.id,
      orderId: order.id,
      firstName: a.firstName,
      lastName: a.lastName,
      ticketType: a.ticketType,
      roommatePreference: a.roommatePreference,
      assignedRoom: a.assignedRoom,
    }))
  )
  const placements = resolvePlacements(attendees, roomsConfig)
  const eligible = attendees.filter((a) => ROOM_ELIGIBLE_TICKET_TYPES.includes(a.ticketType))
  const sundayNightByAttendeeId = new Map(
    orders.flatMap((o) => o.attendees.map((a) => [a.id, a.sundayNightAddOn] as const))
  )

  const header = [
    "Room",
    "First Name",
    "Last Name",
    "Ticket Type",
    "Roommate Preference",
    "Sunday Night Add-on",
  ]
  const rows: string[] = [csvRow(header)]

  const sorted = [...eligible].sort((a, b) => {
    const roomA = placements.get(a.id) ?? "zzz Unassigned"
    const roomB = placements.get(b.id) ?? "zzz Unassigned"
    return roomA.localeCompare(roomB, undefined, { numeric: true })
  })

  for (const a of sorted) {
    rows.push(
      csvRow([
        placements.get(a.id) ?? "Unassigned",
        a.firstName,
        a.lastName,
        ticketLabel(a.ticketType),
        a.roommatePreference,
        sundayNightByAttendeeId.get(a.id) ? "Yes" : "No",
      ])
    )
  }

  const csv = rows.join("\r\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="camperween-room-assignments.csv"`,
    },
  })
}
