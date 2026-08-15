import type { RoomsContent } from "./content"

export interface AssignmentAttendee {
  id: string
  orderId: string
  firstName: string
  lastName: string
  ticketType: string
  roommatePreference: string | null
}

interface Room {
  id: string
  lodgeName: string
  capacity: number
}

interface Occupant {
  attendeeId: string
  name: string
  ticketType: string
  isKiddie: boolean
  note?: string
}

export interface RoomResult {
  room: Room
  occupants: Occupant[]
}

export interface AssignmentReport {
  rooms: RoomResult[]
  unusedRooms: Room[]
  unassigned: { name: string; ticketType: string; reason: string }[]
  reservedRoomNote: string
  flags: string[]
}

// Which tiers get room-assigned, which lodge pool they draw from, and whether
// they can be pooled together with strangers from the same tier to fill a room.
const TIER_ROOM_CONFIG: Record<string, { lodgePool: "large" | "cary"; poolable: boolean }> = {
  roommates: { lodgePool: "large", poolable: true },
  buddies: { lodgePool: "cary", poolable: true },
  couples: { lodgePool: "cary", poolable: false },
  single: { lodgePool: "cary", poolable: false },
}

function fullName(a: { firstName: string; lastName: string }): string {
  return `${a.firstName} ${a.lastName}`.trim()
}

function buildRoomPool(lodgeName: string, blocks: { count: number; capacity: number }[]): Room[] {
  const rooms: Room[] = []
  let n = 1
  for (const block of blocks) {
    for (let i = 0; i < block.count; i++) {
      rooms.push({ id: `${lodgeName} ${n}`, lodgeName, capacity: block.capacity })
      n++
    }
  }
  return rooms
}

class UnionFind {
  private parent = new Map<string, string>()

  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x)
    const p = this.parent.get(x)!
    if (p !== x) {
      const root = this.find(p)
      this.parent.set(x, root)
      return root
    }
    return x
  }

  union(a: string, b: string) {
    const ra = this.find(a)
    const rb = this.find(b)
    if (ra !== rb) this.parent.set(ra, rb)
  }
}

interface Party {
  id: string
  ticketType: string
  members: AssignmentAttendee[]
}

function groupIntoParties(people: AssignmentAttendee[]): Party[] {
  const uf = new UnionFind()
  for (const p of people) uf.find(p.id)

  // Same order + same tier is a strong default signal (families/couples signing up together).
  for (const a of people) {
    for (const b of people) {
      if (a.id !== b.id && a.orderId === b.orderId && a.ticketType === b.ticketType) {
        uf.union(a.id, b.id)
      }
    }
  }

  // Name-mention matching in roommatePreference text, restricted to the same tier
  // so it can't accidentally merge e.g. a "single" with a "buddies" registrant.
  for (const a of people) {
    const pref = (a.roommatePreference ?? "").toLowerCase()
    if (!pref.trim()) continue
    for (const b of people) {
      if (a.id === b.id || a.ticketType !== b.ticketType) continue
      const bName = fullName(b).toLowerCase()
      if (bName.length > 1 && pref.includes(bName)) {
        uf.union(a.id, b.id)
      }
    }
  }

  const groups = new Map<string, AssignmentAttendee[]>()
  for (const p of people) {
    const root = uf.find(p.id)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(p)
  }

  return [...groups.entries()].map(([root, members]) => ({
    id: root,
    ticketType: members[0].ticketType,
    members,
  }))
}

function packExclusive(
  parties: Party[],
  rooms: Room[]
): { assigned: Map<string, Party[]>; usedRoomIds: Set<string>; unassigned: Party[] } {
  const sortedParties = [...parties].sort((a, b) => b.members.length - a.members.length)
  const availableRooms = [...rooms].sort((a, b) => a.capacity - b.capacity)
  const used = new Set<string>()
  const assigned = new Map<string, Party[]>()
  const unassigned: Party[] = []

  for (const party of sortedParties) {
    const room = availableRooms.find((r) => !used.has(r.id) && r.capacity >= party.members.length)
    if (room) {
      used.add(room.id)
      assigned.set(room.id, [party])
    } else {
      unassigned.push(party)
    }
  }

  return { assigned, usedRoomIds: used, unassigned }
}

function packPoolable(
  parties: Party[],
  rooms: Room[]
): { assigned: Map<string, Party[]>; usedRoomIds: Set<string>; unassigned: Party[] } {
  const sortedParties = [...parties].sort((a, b) => b.members.length - a.members.length)
  const bins = rooms.map((r) => ({ room: r, remaining: r.capacity }))
  const assigned = new Map<string, Party[]>()
  const unassigned: Party[] = []

  for (const party of sortedParties) {
    let best: (typeof bins)[number] | null = null
    for (const bin of bins) {
      if (bin.remaining >= party.members.length) {
        if (!best || bin.remaining < best.remaining) best = bin
      }
    }
    if (best) {
      best.remaining -= party.members.length
      if (!assigned.has(best.room.id)) assigned.set(best.room.id, [])
      assigned.get(best.room.id)!.push(party)
    } else {
      unassigned.push(party)
    }
  }

  const usedRoomIds = new Set(assigned.keys())
  return { assigned, usedRoomIds, unassigned }
}

export function assignRooms(
  attendees: AssignmentAttendee[],
  roomsConfig: RoomsContent
): AssignmentReport {
  const flags: string[] = []

  const caryRooms = buildRoomPool(
    "Cary Lodge",
    roomsConfig.lodges.find((l) => l.name === "Cary Lodge")?.rooms ?? []
  )
  const morrisRooms = buildRoomPool(
    "Morris Lodge",
    roomsConfig.lodges.find((l) => l.name === "Morris Lodge")?.rooms ?? []
  )
  const millerRooms = buildRoomPool(
    "Miller Lodge",
    roomsConfig.lodges.find((l) => l.name === "Miller Lodge")?.rooms ?? []
  )
  const largeRooms = [...morrisRooms, ...millerRooms]

  const kiddies = attendees.filter((a) => a.ticketType === "kiddie")
  const roomSeekers = attendees.filter((a) => a.ticketType in TIER_ROOM_CONFIG)

  // Reserved-room special case: pull a matching named registrant out of the
  // general pool before packing.
  const reserved = roomsConfig.reservedRoom
  const reservedRoomObj: Room = { id: reserved.lodgeName, lodgeName: reserved.lodgeName, capacity: 1 }
  let reservedOccupant: AssignmentAttendee | undefined
  let reservedRoomNote = reserved.note
  const poolAfterReserved = roomSeekers.filter((a) => {
    if (
      a.ticketType === reserved.reservedForTicketTypeId &&
      fullName(a).toLowerCase() === reserved.reservedForName.toLowerCase()
    ) {
      reservedOccupant = a
      return false
    }
    return true
  })
  if (reservedOccupant) {
    reservedRoomNote = `Assigned to ${fullName(reservedOccupant)}, as reserved.`
  }

  const largeSeekers = poolAfterReserved.filter(
    (a) => TIER_ROOM_CONFIG[a.ticketType].lodgePool === "large"
  )
  const carySeekers = poolAfterReserved.filter(
    (a) => TIER_ROOM_CONFIG[a.ticketType].lodgePool === "cary"
  )

  // Large pool (Miller/Morris): "roommates" tier only, always poolable.
  const largeParties = groupIntoParties(largeSeekers)
  const largePacked = packPoolable(largeParties, largeRooms)

  // Cary pool: exclusive (single/couples) get dedicated rooms first, then
  // poolable "buddies" parties fill whatever's left.
  const caryExclusiveParties = groupIntoParties(
    carySeekers.filter((a) => !TIER_ROOM_CONFIG[a.ticketType].poolable)
  )
  const caryPoolableParties = groupIntoParties(
    carySeekers.filter((a) => TIER_ROOM_CONFIG[a.ticketType].poolable)
  )
  const caryExclusivePacked = packExclusive(caryExclusiveParties, caryRooms)
  const caryRemainingRooms = caryRooms.filter((r) => !caryExclusivePacked.usedRoomIds.has(r.id))
  const caryPoolablePacked = packPoolable(caryPoolableParties, caryRemainingRooms)

  // Flag exclusive parties that didn't come out to the expected size.
  for (const party of caryExclusiveParties) {
    if (party.ticketType === "single" && party.members.length !== 1) {
      flags.push(
        `${party.members.map(fullName).join(", ")}: grouped as a "Single" party of ${party.members.length} (expected 1) -- please verify.`
      )
    }
    if (party.ticketType === "couples" && party.members.length !== 2) {
      flags.push(
        `${party.members.map(fullName).join(", ")}: grouped as a "Couple" party of ${party.members.length} (expected 2) -- please verify.`
      )
    }
  }

  const allRooms = [...caryRooms, ...largeRooms]
  const roomById = new Map(allRooms.map((r) => [r.id, r]))
  const roomResults = new Map<string, RoomResult>()

  function addAssignments(assigned: Map<string, Party[]>) {
    for (const [roomId, parties] of assigned) {
      const room = roomById.get(roomId)!
      if (!roomResults.has(roomId)) roomResults.set(roomId, { room, occupants: [] })
      for (const party of parties) {
        for (const member of party.members) {
          roomResults.get(roomId)!.occupants.push({
            attendeeId: member.id,
            name: fullName(member),
            ticketType: member.ticketType,
            isKiddie: false,
          })
        }
      }
    }
  }

  addAssignments(largePacked.assigned)
  addAssignments(caryExclusivePacked.assigned)
  addAssignments(caryPoolablePacked.assigned)

  if (reservedOccupant) {
    roomResults.set(reservedRoomObj.id, {
      room: reservedRoomObj,
      occupants: [
        {
          attendeeId: reservedOccupant.id,
          name: fullName(reservedOccupant),
          ticketType: reservedOccupant.ticketType,
          isKiddie: false,
        },
      ],
    })
  }

  // Attach kiddies to a room their order-mate already landed in.
  const attendeeIdToRoomId = new Map<string, string>()
  for (const [roomId, result] of roomResults) {
    for (const occ of result.occupants) attendeeIdToRoomId.set(occ.attendeeId, roomId)
  }
  const attendeeById = new Map(attendees.map((a) => [a.id, a]))

  for (const kid of kiddies) {
    const orderMateRoomId = [...attendeeIdToRoomId.entries()].find(([attendeeId]) => {
      const mate = attendeeById.get(attendeeId)
      return mate && mate.orderId === kid.orderId
    })?.[1]

    if (orderMateRoomId) {
      const result = roomResults.get(orderMateRoomId)!
      result.occupants.push({
        attendeeId: kid.id,
        name: fullName(kid),
        ticketType: kid.ticketType,
        isKiddie: true,
      })
      if (result.occupants.length > result.room.capacity) {
        flags.push(
          `${result.room.id} now has ${result.occupants.length} people (capacity ${result.room.capacity}) after adding ${fullName(kid)} -- over capacity, please review.`
        )
      }
    } else {
      flags.push(`${fullName(kid)} (Kiddie): no other attendee in their order got a room to join.`)
    }
  }

  const unassigned = [...largePacked.unassigned, ...caryExclusivePacked.unassigned, ...caryPoolablePacked.unassigned].map(
    (party) => ({
      name: party.members.map(fullName).join(", "),
      ticketType: party.ticketType,
      reason: "No room with enough remaining capacity was found.",
    })
  )

  const usedRoomIds = new Set(roomResults.keys())
  const unusedRooms = allRooms.filter((r) => !usedRoomIds.has(r.id))

  return {
    rooms: [...roomResults.values()].sort((a, b) => a.room.id.localeCompare(b.room.id, undefined, { numeric: true })),
    unusedRooms,
    unassigned,
    reservedRoomNote,
    flags,
  }
}
