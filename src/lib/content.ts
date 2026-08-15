import fs from "node:fs"
import path from "node:path"
import { load as loadYamlDocument } from "js-yaml"

export interface TicketTypeContent {
  id: string
  label: string
  description: string
  price: number
  hasLodging: boolean
  allowsRoommatePreference: boolean
}

export interface AddOnContent {
  id: string
  label: string
  description: string
  price: number
}

export interface PricingContent {
  ticketTypes: TicketTypeContent[]
  addOns: AddOnContent[]
}

export interface AgeCategoryContent {
  id: string
  label: string
}

export interface LabelsContent {
  groupInfo: {
    sectionTitle: string
    primaryContact: {
      sectionTitle: string
      subtitle: string
      firstName: string
      lastName: string
      email: string
      phone: string
    }
    arrivalExpectation: string
    emergencyContactName: string
    emergencyContactPhone: string
  }
  waiver: {
    sectionTitle: string
    paragraphs: string[]
    agreeCheckbox: string
    signatureName: string
    parentGuardianWaiver: string
  }
  comments: {
    sectionTitle: string
  }
  attendees: {
    sectionTitle: string
    addAttendeeButton: string
    sameAsPrimaryContact: string
    firstName: string
    lastName: string
    email: string
    phone: string
    ageCategory: string
    registrationType: string
    registrationTypeDescription: string
    addOnsSubtitle: string
    attendeeInfoSubtitle: string
    roommatePreference: string
    sameRoommatesAsFirst: string
    dietaryRestrictions: string
    specialAccommodations: string
    volunteerTasksTitle: string
    volunteerTasksDescription: string
  }
  ageCategories: AgeCategoryContent[]
  volunteerTasks: string[]
  orderSummary: {
    sectionTitle: string
    submitButton: string
    submitNote: string
  }
}

export interface RoomBlockContent {
  count: number
  capacity: number
}

export interface RoomsContent {
  lodges: {
    name: string
    rooms: RoomBlockContent[]
  }[]
  reservedRoom: {
    lodgeName: string
    reservedForName: string
    reservedForTicketTypeId: string
    note: string
  }
}

function loadYaml<T>(fileName: string): T {
  const filePath = path.join(process.cwd(), "content", fileName)
  const raw = fs.readFileSync(filePath, "utf8")
  return loadYamlDocument(raw) as T
}

export function getPricingContent(): PricingContent {
  return loadYaml<PricingContent>("pricing.yaml")
}

export function getLabelsContent(): LabelsContent {
  return loadYaml<LabelsContent>("labels.yaml")
}

export function getRoomsContent(): RoomsContent {
  return loadYaml<RoomsContent>("rooms.yaml")
}
