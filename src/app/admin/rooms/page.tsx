import { redirect } from "next/navigation"
import { getAllOrders, isAdminAuthed } from "@/app/actions"
import { getPricingContent, getRoomsContent } from "@/lib/content"
import { findTicketType } from "@/lib/pricing"
import { assignRooms, type AssignmentAttendee } from "@/lib/roomAssignment"

export default async function AdminRoomsPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin")
  }

  const orders = await getAllOrders()
  const pricing = getPricingContent()
  const roomsConfig = getRoomsContent()

  const attendees: AssignmentAttendee[] = orders.flatMap((order) =>
    order.attendees.map((a) => ({
      id: a.id,
      orderId: order.id,
      firstName: a.firstName,
      lastName: a.lastName,
      ticketType: a.ticketType,
      roommatePreference: a.roommatePreference,
    }))
  )

  const report = assignRooms(attendees, roomsConfig)

  function ticketLabel(ticketType: string) {
    try {
      return findTicketType(pricing, ticketType).label
    } catch {
      return ticketType
    }
  }

  const excluded = attendees.filter((a) => !["roommates", "buddies", "couples", "single", "kiddie"].includes(a.ticketType))

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Suggested room assignments</h1>
          <p className="text-neutral-400 text-sm mt-1">
            A best-effort algorithmic first pass, grouped from housing tier, who registered
            together, and named roommate requests. Review before finalizing -- it does not know
            your campers personally.
          </p>
        </div>

        {report.flags.length > 0 && (
          <section className="rounded-lg border border-amber-600 bg-amber-500/10 p-4 space-y-1">
            <div className="text-sm font-semibold text-amber-400">Needs your review</div>
            {report.flags.map((f, i) => (
              <div key={i} className="text-sm text-neutral-200">
                {f}
              </div>
            ))}
          </section>
        )}

        {report.unassigned.length > 0 && (
          <section className="rounded-lg border border-red-800 bg-red-950/30 p-4 space-y-1">
            <div className="text-sm font-semibold text-red-400">Could not be assigned a room</div>
            {report.unassigned.map((u, i) => (
              <div key={i} className="text-sm text-neutral-200">
                {u.name} ({ticketLabel(u.ticketType)}) -- {u.reason}
              </div>
            ))}
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-100">Rooms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.rooms.map((r) => (
              <div key={r.room.id} className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-neutral-100">{r.room.id}</div>
                  <div className="text-xs text-neutral-500">
                    {r.occupants.length} / {r.room.capacity}
                  </div>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-neutral-300">
                  {r.occupants.map((o) => (
                    <li key={o.attendeeId}>
                      {o.name}{" "}
                      <span className="text-neutral-500">
                        ({ticketLabel(o.ticketType)}
                        {o.isKiddie ? ", with a parent in this room" : ""})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {!report.rooms.some((r) => r.room.id === roomsConfig.reservedRoom.lodgeName) && (
          <p className="text-sm text-neutral-500">
            {roomsConfig.reservedRoom.lodgeName}: {report.reservedRoomNote}
          </p>
        )}

        {report.unusedRooms.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-100">Unused rooms</h2>
            <p className="text-sm text-neutral-500">
              {report.unusedRooms.map((r) => `${r.id} (cap ${r.capacity})`).join(", ")}
            </p>
          </section>
        )}

        {excluded.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-100">
              Not assigned a room (day rate / own camper)
            </h2>
            <p className="text-sm text-neutral-500">
              {excluded.map((a) => `${a.firstName} ${a.lastName}`).join(", ")}
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
