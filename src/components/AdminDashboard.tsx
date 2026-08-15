"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { adminLogout, deleteOrder, setOrderPaymentStatus } from "@/app/actions"
import type { LabelsContent, PricingContent } from "@/lib/content"
import { formatCurrency } from "@/lib/pricing"
import { useRouter } from "next/navigation"
import { AdminAttendeeCard } from "./AdminAttendeeCard"
import { AdminOrderNote } from "./AdminOrderNote"

interface AttendeeRow {
  id: string
  firstName: string
  lastName: string
  email: string | null
  ageCategory: string
  ticketType: string
  price: number
  roommatePreference: string | null
  dietaryRestrictions: string | null
  phone: string | null
  specialAccommodations: string | null
  volunteerTasks: string | null
  sundayNightAddOn: boolean
  alcoholAddOn: boolean
}

interface OrderRow {
  id: string
  purchaserFirstName: string
  purchaserLastName: string
  purchaserEmail: string
  emergencyContactName: string
  emergencyContactPhone: string
  comments: string | null
  adminNote: string | null
  total: number
  paymentStatus: string
  createdAt: Date
  attendees: AttendeeRow[]
}

export function AdminDashboard({
  orders,
  pricing,
  labels,
}: {
  orders: OrderRow[]
  pricing: PricingContent
  labels: LabelsContent
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(
    () => orders.filter((o) => filter === "all" || o.paymentStatus === filter),
    [orders, filter]
  )

  const totalAttendees = orders.reduce((sum, o) => sum + o.attendees.length, 0)
  const totalCollected = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0)
  const totalOwed = orders
    .filter((o) => o.paymentStatus !== "paid")
    .reduce((sum, o) => sum + o.total, 0)

  function togglePaid(orderId: string, currentlyPaid: boolean) {
    startTransition(async () => {
      await setOrderPaymentStatus(orderId, !currentlyPaid)
      router.refresh()
    })
  }

  function handleDeleteOrder(orderId: string, purchaserName: string) {
    if (
      !window.confirm(
        `Delete ${purchaserName}'s entire registration, including all attendees? This can't be undone.`
      )
    ) {
      return
    }
    startTransition(async () => {
      await deleteOrder(orderId)
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-100">Camperween registrations</h1>
            <p className="text-neutral-400 text-sm mt-1">
              {orders.length} orders &middot; {totalAttendees} attendees
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/admin/export"
              className="rounded-md border border-neutral-600 px-4 py-2 text-sm text-neutral-200 hover:border-neutral-400"
            >
              Export CSV
            </a>
            <Link
              href="/admin/print"
              className="rounded-md border border-neutral-600 px-4 py-2 text-sm text-neutral-200 hover:border-neutral-400"
            >
              Print list
            </Link>
            <button
              onClick={() => {
                startTransition(async () => {
                  await adminLogout()
                  router.push("/admin")
                  router.refresh()
                })
              }}
              className="rounded-md border border-neutral-600 px-4 py-2 text-sm text-neutral-200 hover:border-neutral-400"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Collected" value={formatCurrency(totalCollected)} />
          <StatCard label="Outstanding" value={formatCurrency(totalOwed)} />
          <StatCard label="Total attendees" value={String(totalAttendees)} />
        </div>

        <div className="flex gap-2">
          {(["all", "unpaid", "paid"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm capitalize ${
                filter === f
                  ? "bg-amber-600 text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="rounded-lg border border-neutral-700 bg-neutral-900">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div>
                  <div className="font-medium text-neutral-100">
                    {order.purchaserFirstName} {order.purchaserLastName}{" "}
                    <span className="text-neutral-500 font-normal">
                      ({order.attendees.length} attendee{order.attendees.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="text-sm text-neutral-400">{order.purchaserEmail}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-neutral-100">
                    {formatCurrency(order.total)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePaid(order.id, order.paymentStatus === "paid")
                    }}
                    disabled={isPending}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      order.paymentStatus === "paid"
                        ? "bg-green-700 text-green-100 hover:bg-green-600"
                        : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
                    }`}
                  >
                    {order.paymentStatus === "paid" ? "Paid" : "Mark paid"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteOrder(
                        order.id,
                        `${order.purchaserFirstName} ${order.purchaserLastName}`
                      )
                    }}
                    disabled={isPending}
                    className="text-sm text-neutral-400 hover:text-red-400 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expanded === order.id && (
                <div className="border-t border-neutral-800 p-4 space-y-4">
                  <div className="text-sm text-neutral-400">
                    Emergency contact: {order.emergencyContactName} &middot;{" "}
                    {order.emergencyContactPhone}
                  </div>
                  {order.comments && (
                    <div className="text-sm text-neutral-400">Comments: {order.comments}</div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {order.attendees.map((a) => (
                      <AdminAttendeeCard key={a.id} attendee={a} pricing={pricing} labels={labels} />
                    ))}
                    {order.attendees.length === 0 && (
                      <p className="text-neutral-500 text-sm">No attendees left on this order.</p>
                    )}
                  </div>
                  <AdminOrderNote orderId={order.id} note={order.adminNote} />
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-neutral-500 text-sm py-8 text-center">No orders in this view.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold text-neutral-100 mt-1">{value}</div>
    </div>
  )
}
