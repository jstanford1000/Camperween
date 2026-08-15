import { redirect } from "next/navigation"
import { getAllOrders, isAdminAuthed } from "@/app/actions"
import { EVENT_NAME } from "@/lib/config"
import { getPricingContent } from "@/lib/content"
import { findTicketType, formatCurrency } from "@/lib/pricing"
import { PrintButton } from "@/components/PrintButton"

export default async function AdminPrintPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin")
  }
  const pricing = getPricingContent()
  const orders = await getAllOrders()
  type Order = (typeof orders)[number]
  type Attendee = Order["attendees"][number]

  const attendees = orders.flatMap((order: Order) =>
    order.attendees.map((a: Attendee) => ({ ...a, order }))
  )
  attendees.sort((a, b) => a.lastName.localeCompare(b.lastName))

  return (
    <div className="min-h-screen bg-white text-black py-8 px-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between no-print">
          <h1 className="text-xl font-bold">{EVENT_NAME} -- Attendee list</h1>
          <PrintButton />
        </div>
        <h1 className="text-xl font-bold hidden print:block">{EVENT_NAME} -- Attendee list</h1>
        <p className="text-sm text-neutral-600">
          {attendees.length} attendees across {orders.length} orders. Generated{" "}
          {new Date().toLocaleDateString()}.
        </p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="py-1 pr-2">Name</th>
              <th className="py-1 pr-2">Age</th>
              <th className="py-1 pr-2">Ticket</th>
              <th className="py-1 pr-2">Add-ons</th>
              <th className="py-1 pr-2">Dietary</th>
              <th className="py-1 pr-2">Purchaser / contact</th>
              <th className="py-1 pr-2">Price</th>
              <th className="py-1 pr-2">Paid</th>
            </tr>
          </thead>
          <tbody>
            {attendees.map((a: Attendee & { order: Order }) => (
              <tr key={a.id} className="border-b border-neutral-300 align-top">
                <td className="py-1 pr-2">
                  {a.firstName} {a.lastName}
                </td>
                <td className="py-1 pr-2">{a.ageCategory}</td>
                <td className="py-1 pr-2">
                  {findTicketType(pricing, a.ticketType).label}
                </td>
                <td className="py-1 pr-2">
                  {[a.sundayNightAddOn && "Sun", a.alcoholAddOn && "Alc"]
                    .filter(Boolean)
                    .join(", ")}
                </td>
                <td className="py-1 pr-2">{a.dietaryRestrictions || ""}</td>
                <td className="py-1 pr-2">
                  {a.order.purchaserFirstName} {a.order.purchaserLastName}
                  <br />
                  {a.order.emergencyContactPhone}
                </td>
                <td className="py-1 pr-2">{formatCurrency(a.price)}</td>
                <td className="py-1 pr-2">{a.order.paymentStatus === "paid" ? "Y" : "N"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
