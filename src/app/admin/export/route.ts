import { NextResponse } from "next/server"
import { getAllOrders, isAdminAuthed } from "@/app/actions"
import { getPricingContent } from "@/lib/content"
import { findTicketType } from "@/lib/pricing"
import { csvCell } from "@/lib/csv"

function ticketLabel(pricing: ReturnType<typeof getPricingContent>, ticketType: string): string {
  try {
    return findTicketType(pricing, ticketType).label
  } catch {
    return ticketType
  }
}

export async function GET() {
  if (!(await isAdminAuthed())) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const pricing = getPricingContent()
  const orders = await getAllOrders()

  const header = [
    "Order ID",
    "Purchaser First Name",
    "Purchaser Last Name",
    "Purchaser Email",
    "Purchaser Phone",
    "Payment Status",
    "Order Total",
    "Attendee First Name",
    "Attendee Last Name",
    "Attendee Email",
    "Attendee Phone",
    "Age Category",
    "Ticket Type",
    "Price",
    "Sunday Night Add-on",
    "Alcohol Add-on",
    "Roommate Preference",
    "Dietary Restrictions",
    "Special Accommodations",
    "Order Created At",
  ]

  const rows: string[] = [header.map(csvCell).join(",")]

  for (const order of orders) {
    for (const a of order.attendees) {
      rows.push(
        [
          order.id,
          order.purchaserFirstName,
          order.purchaserLastName,
          order.purchaserEmail,
          order.purchaserPhone,
          order.paymentStatus,
          order.total,
          a.firstName,
          a.lastName,
          a.email,
          a.phone,
          a.ageCategory,
          ticketLabel(pricing, a.ticketType),
          a.price,
          a.sundayNightAddOn ? "Yes" : "No",
          a.alcoholAddOn ? "Yes" : "No",
          a.roommatePreference,
          a.dietaryRestrictions,
          a.specialAccommodations,
          order.createdAt.toISOString(),
        ]
          .map(csvCell)
          .join(",")
      )
    }
  }

  const csv = rows.join("\r\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="camperween-attendees.csv"`,
    },
  })
}
