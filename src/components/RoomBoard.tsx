"use client"

import { useState } from "react"
import { setAttendeeRoom } from "@/app/actions"
import type { Room } from "@/lib/roomAssignment"

export interface RoomBoardPerson {
  id: string
  name: string
  ticketTypeLabel: string
  roommatePreference: string | null
  sundayNightAddOn: boolean
  initialRoomId: string | null
}

export function RoomBoard({
  rooms,
  people,
  flags,
  reservedLodgeName,
  reservedRoomNote,
}: {
  rooms: Room[]
  people: RoomBoardPerson[]
  flags: string[]
  reservedLodgeName: string
  reservedRoomNote: string
}) {
  const [placements, setPlacements] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {}
    for (const p of people) initial[p.id] = p.initialRoomId
    return initial
  })

  async function handleDrop(personId: string, roomId: string | null) {
    const previous = placements[personId]
    if (previous === roomId) return
    setPlacements((prev) => ({ ...prev, [personId]: roomId }))
    try {
      await setAttendeeRoom(personId, roomId)
    } catch {
      setPlacements((prev) => ({ ...prev, [personId]: previous }))
    }
  }

  const peopleByRoom = new Map<string, RoomBoardPerson[]>()
  const unassigned: RoomBoardPerson[] = []
  for (const p of people) {
    const roomId = placements[p.id]
    if (roomId) {
      if (!peopleByRoom.has(roomId)) peopleByRoom.set(roomId, [])
      peopleByRoom.get(roomId)!.push(p)
    } else {
      unassigned.push(p)
    }
  }

  const lodgeGroups = new Map<string, Room[]>()
  for (const room of rooms) {
    if (!lodgeGroups.has(room.lodgeName)) lodgeGroups.set(room.lodgeName, [])
    lodgeGroups.get(room.lodgeName)!.push(room)
  }

  return (
    <div className="space-y-6">
      {flags.length > 0 && (
        <section className="rounded-lg border border-amber-600 bg-amber-500/10 p-4 space-y-1">
          <div className="text-sm font-semibold text-amber-400">Needs your review</div>
          {flags.map((f, i) => (
            <div key={i} className="text-sm text-neutral-200">
              {f}
            </div>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-100">Unassigned</h2>
        <DropZone label="Drag people here to unassign" roomId={null} capacity={null} people={unassigned} onDrop={handleDrop} />
      </section>

      {[...lodgeGroups.entries()].map(([lodgeName, lodgeRooms]) => (
        <section key={lodgeName} className="space-y-2">
          <h2 className="text-lg font-semibold text-neutral-100">{lodgeName}</h2>
          {lodgeName === reservedLodgeName && (
            <p className="text-xs text-neutral-500">{reservedRoomNote}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lodgeRooms.map((room) => (
              <DropZone
                key={room.id}
                label={room.id}
                roomId={room.id}
                capacity={room.capacity}
                people={peopleByRoom.get(room.id) ?? []}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function DropZone({
  label,
  roomId,
  capacity,
  people,
  onDrop,
}: {
  label: string
  roomId: string | null
  capacity: number | null
  people: RoomBoardPerson[]
  onDrop: (personId: string, roomId: string | null) => void
}) {
  const [isOver, setIsOver] = useState(false)
  const overCapacity = capacity !== null && people.length > capacity

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        const personId = e.dataTransfer.getData("text/plain")
        if (personId) onDrop(personId, roomId)
      }}
      className={`rounded-lg border p-3 min-h-[72px] transition-colors ${
        isOver ? "border-amber-500 bg-amber-500/10" : overCapacity ? "border-red-600 bg-neutral-900" : "border-neutral-700 bg-neutral-900"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-neutral-100 text-sm">{label}</div>
        {capacity !== null && (
          <div className={`text-xs ${overCapacity ? "text-red-400 font-semibold" : "text-neutral-500"}`}>
            {people.length} / {capacity}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {people.map((p) => (
          <PersonCard key={p.id} person={p} />
        ))}
        {people.length === 0 && <div className="text-xs text-neutral-600">Drop someone here</div>}
      </div>
    </div>
  )
}

function PersonCard({ person }: { person: RoomBoardPerson }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", person.id)}
      title={person.roommatePreference?.trim() ? `Wanted: ${person.roommatePreference}` : undefined}
      className="rounded-md border border-neutral-600 bg-neutral-800 px-2 py-1 text-xs text-neutral-100 cursor-grab active:cursor-grabbing"
    >
      <span className="flex items-center gap-1">
        {person.sundayNightAddOn && <span title="Staying Sunday night">🌙</span>}
        <span>{person.name}</span>
      </span>
      <span className="block text-[10px] text-neutral-500">{person.ticketTypeLabel}</span>
    </div>
  )
}
