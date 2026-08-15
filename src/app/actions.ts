"use server"

import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getPricingContent } from "@/lib/content"
import {
  TicketTypeId,
  calculateAttendeePrice,
  calculateOrderTotal,
  findTicketType,
} from "@/lib/pricing"
import { sendAdminNotificationEmail, sendConfirmationEmail } from "@/lib/email"

export interface AttendeeFormData {
  firstName: string
  lastName: string
  email: string
  ageCategory: string
  ticketType: TicketTypeId
  roommatePreference: string
  dietaryRestrictions: string
  phone: string
  specialAccommodations: string
  volunteerTasks: string[]
  sundayNightAddOn: boolean
  alcoholAddOn: boolean
}

export interface OrderFormData {
  purchaserFirstName: string
  purchaserLastName: string
  purchaserEmail: string
  purchaserPhone: string
  arrivalExpectation: string
  emergencyContactName: string
  emergencyContactPhone: string
  liabilitySignatureName: string
  liabilitySignatureDate: string
  parentGuardianWaiver: boolean
  comments: string
  attendees: AttendeeFormData[]
}

export async function createOrder(data: OrderFormData) {
  if (!data.attendees.length) {
    throw new Error("At least one attendee is required")
  }

  const pricing = getPricingContent()
  for (const a of data.attendees) {
    findTicketType(pricing, a.ticketType)
  }

  const subtotal = calculateOrderTotal(data.attendees, pricing)
  const total = subtotal

  const order = await prisma.order.create({
    data: {
      purchaserFirstName: data.purchaserFirstName,
      purchaserLastName: data.purchaserLastName,
      purchaserEmail: data.purchaserEmail,
      purchaserPhone: data.purchaserPhone,
      arrivalExpectation: data.arrivalExpectation,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      liabilitySignatureName: data.liabilitySignatureName,
      liabilitySignatureDate: data.liabilitySignatureDate,
      parentGuardianWaiver: data.parentGuardianWaiver,
      comments: data.comments || null,
      subtotal,
      total,
      attendees: {
        create: data.attendees.map((a) => ({
          firstName: a.firstName,
          lastName: a.lastName,
          email: a.email || null,
          ageCategory: a.ageCategory,
          ticketType: a.ticketType,
          price: calculateAttendeePrice(a, pricing),
          roommatePreference: a.roommatePreference || null,
          dietaryRestrictions: a.dietaryRestrictions || null,
          phone: a.phone || null,
          specialAccommodations: a.specialAccommodations || null,
          volunteerTasks: JSON.stringify(a.volunteerTasks),
          sundayNightAddOn: a.sundayNightAddOn,
          alcoholAddOn: a.alcoholAddOn,
        })),
      },
    },
  })

  const emailData = {
    orderId: order.id,
    purchaserFirstName: data.purchaserFirstName,
    purchaserLastName: data.purchaserLastName,
    purchaserEmail: data.purchaserEmail,
    total,
    attendees: data.attendees.map((a) => ({
      firstName: a.firstName,
      lastName: a.lastName,
      ticketLabel: findTicketType(pricing, a.ticketType).label,
      price: calculateAttendeePrice(a, pricing),
    })),
  }
  await sendConfirmationEmail(emailData)
  await sendAdminNotificationEmail(emailData)

  return order.id
}

export async function getOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { attendees: true },
  })
}

const ADMIN_COOKIE = "camperween_admin"

export async function adminLogin(password: string): Promise<boolean> {
  if (password !== process.env.ADMIN_PASSWORD) {
    return false
  }
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, process.env.ADMIN_PASSWORD, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  })
  return true
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
}

export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = await cookies()
  const value = cookieStore.get(ADMIN_COOKIE)?.value
  return !!value && value === process.env.ADMIN_PASSWORD
}

export async function getAllOrders() {
  return prisma.order.findMany({
    include: { attendees: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function setOrderPaymentStatus(
  orderId: string,
  paid: boolean,
  paidNote?: string
) {
  if (!(await isAdminAuthed())) {
    throw new Error("Not authorized")
  }
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: paid ? "paid" : "unpaid",
      paidAt: paid ? new Date() : null,
      paidNote: paidNote ?? null,
    },
  })
}

export interface AttendeeUpdateData {
  firstName: string
  lastName: string
  email: string
  phone: string
  ageCategory: string
  ticketType: TicketTypeId
  price: number
  roommatePreference: string
  dietaryRestrictions: string
  specialAccommodations: string
  sundayNightAddOn: boolean
  alcoholAddOn: boolean
}

async function recalculateOrderTotal(orderId: string) {
  const attendees = await prisma.attendee.findMany({ where: { orderId } })
  const total = attendees.reduce((sum, a) => sum + a.price, 0)
  await prisma.order.update({ where: { id: orderId }, data: { subtotal: total, total } })
}

export async function updateAttendee(attendeeId: string, data: AttendeeUpdateData) {
  if (!(await isAdminAuthed())) {
    throw new Error("Not authorized")
  }
  const attendee = await prisma.attendee.update({
    where: { id: attendeeId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      ageCategory: data.ageCategory,
      ticketType: data.ticketType,
      price: data.price,
      roommatePreference: data.roommatePreference || null,
      dietaryRestrictions: data.dietaryRestrictions || null,
      specialAccommodations: data.specialAccommodations || null,
      sundayNightAddOn: data.sundayNightAddOn,
      alcoholAddOn: data.alcoholAddOn,
    },
  })
  await recalculateOrderTotal(attendee.orderId)
}

export async function removeAttendeeFromOrder(attendeeId: string) {
  if (!(await isAdminAuthed())) {
    throw new Error("Not authorized")
  }
  const attendee = await prisma.attendee.delete({ where: { id: attendeeId } })
  await recalculateOrderTotal(attendee.orderId)
}

export async function setAttendeeRoom(attendeeId: string, roomId: string | null) {
  if (!(await isAdminAuthed())) {
    throw new Error("Not authorized")
  }
  await prisma.attendee.update({
    where: { id: attendeeId },
    data: { assignedRoom: roomId },
  })
}

export async function deleteOrder(orderId: string) {
  if (!(await isAdminAuthed())) {
    throw new Error("Not authorized")
  }
  await prisma.order.delete({ where: { id: orderId } })
}

export async function updateOrderNote(orderId: string, note: string) {
  if (!(await isAdminAuthed())) {
    throw new Error("Not authorized")
  }
  await prisma.order.update({
    where: { id: orderId },
    data: { adminNote: note || null },
  })
}
