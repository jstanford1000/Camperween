import { redirect } from "next/navigation"
import { getAllOrders, isAdminAuthed } from "@/app/actions"
import { getPricingContent, getRoomsContent } from "@/lib/content"
import { findTicketType } from "@/lib/pricing"
import {
  ROOM_ELIGIBLE_TICKET_TYPES,
  assignRooms,
  getAllRooms,
  resolvePlacements,
  type AttendeeWithAssignment,
} from "@/lib/roomAssignment"
import { RoomBoard, type RoomBoardPerson } from "@/components/RoomBoard"

export default async function AdminRoomsPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin")
  }

  const orders = await getAllOrders()
  const pricing = getPricingContent()
  const roomsConfig = getRoomsContent()

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

  function ticketLabel(ticketType: string) {
    try {
      return findTicketType(pricing, ticketType).label
    } catch {
      return ticketType
    }
  }

  const eligible = attendees.filter((a) => ROOM_ELIGIBLE_TICKET_TYPES.includes(a.ticketType))
  const sundayNightAddOnByAttendeeId = new Map(
    orders.flatMap((o) => o.attendees.map((a) => [a.id, a.sundayNightAddOn] as const))
  )
  const placements = resolvePlacements(attendees, roomsConfig)
  const flags = assignRooms(eligible, roomsConfig).flags

  const people: RoomBoardPerson[] = eligible.map((a) => ({
    id: a.id,
    name: `${a.firstName} ${a.lastName}`.trim(),
    ticketTypeLabel: ticketLabel(a.ticketType),
    roommatePreference: a.roommatePreference,
    sundayNightAddOn: sundayNightAddOnByAttendeeId.get(a.id) ?? false,
    initialRoomId: placements.get(a.id) ?? null,
  }))

  const allRooms = getAllRooms(roomsConfig)

  const excluded = attendees.filter((a) => !ROOM_ELIGIBLE_TICKET_TYPES.includes(a.ticketType))

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-100">Room assignments</h1>
            <p className="text-neutral-400 text-sm mt-1">
              Drag people between rooms to adjust. Unmoved people show the algorithm&apos;s
              suggestion; anything you drag is saved and stays put. Hover a name for their
              roommate request; 🌙 means they added the Sunday night stay.
            </p>
          </div>
          <a
            href="/admin/rooms/export"
            className="rounded-md border border-neutral-600 px-4 py-2 text-sm text-neutral-200 hover:border-neutral-400 shrink-0"
          >
            Export CSV
          </a>
        </div>

        <RoomBoard
          rooms={allRooms}
          people={people}
          flags={flags}
          reservedLodgeName={roomsConfig.reservedRoom.lodgeName}
          reservedRoomNote={roomsConfig.reservedRoom.note}
        />

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
