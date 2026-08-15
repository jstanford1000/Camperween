import Link from "next/link"
import { notFound } from "next/navigation"
import { getOrder } from "@/app/actions"
import { getPricingContent } from "@/lib/content"
import { findTicketType, formatCurrency } from "@/lib/pricing"
import { EVENT_NAME, PAYMENT_INSTRUCTIONS } from "@/lib/config"

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const order = await getOrder(orderId)

  if (!order) {
    notFound()
  }

  type Attendee = (typeof order.attendees)[number]
  const pricing = getPricingContent()

  return (
    <div className="min-h-screen bg-black py-10 px-4 sm:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">You&apos;re registered!</h1>
          <p className="text-neutral-400 mt-1">
            Thanks for signing up for {EVENT_NAME}.{" "}
            <span className="font-bold text-amber-400">
              One last step: send payment below.
            </span>
          </p>
        </div>

        <section className="rounded-lg border border-amber-600 bg-amber-500/10 p-5 space-y-3">
          <h2 className="text-lg font-semibold text-neutral-100">
            Pay <span className="text-2xl font-bold text-amber-400">{formatCurrency(order.total)}</span> via
            Venmo, Zelle, or PayPal now
          </h2>
          <p className="text-sm text-neutral-300">
            We don&apos;t collect payment on this site -- please send your total using one of the
            options below. Include{" "}
            <span className="font-semibold text-neutral-100">
              &quot;{order.purchaserFirstName} {order.purchaserLastName} - Camperween&quot;
            </span>{" "}
            in the note so we can match it to your registration.
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <PaymentOption
              label="Venmo"
              handle={PAYMENT_INSTRUCTIONS.venmo}
              href="https://venmo.com/u/JulieStanford"
              icon={<VenmoIcon />}
            />
            <PaymentOption label="Zelle" handle={PAYMENT_INSTRUCTIONS.zelle} icon={<ZelleIcon />} />
            <PaymentOption
              label="PayPal"
              handle={PAYMENT_INSTRUCTIONS.paypal}
              href="https://paypal.me/juliestanford"
              icon={<PaypalIcon />}
            />
          </dl>
        </section>

        <section className="rounded-lg border border-neutral-700 bg-neutral-900 p-5 space-y-3">
          <h2 className="text-lg font-semibold text-neutral-100">Order summary</h2>
          <div className="space-y-2">
            {order.attendees.map((a: Attendee) => (
              <div key={a.id} className="flex justify-between text-sm text-neutral-300">
                <span>
                  {a.firstName} {a.lastName} &middot;{" "}
                  {findTicketType(pricing, a.ticketType).label}
                </span>
                <span>{formatCurrency(a.price)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-700 pt-3 flex justify-between font-semibold text-neutral-100">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </section>

        <p className="text-sm text-neutral-500">
          Order confirmation #{order.id}. A confirmation was sent to {order.purchaserEmail}.
        </p>

        <Link href="/" className="text-amber-400 hover:text-amber-300 text-sm">
          &larr; Back to registration
        </Link>
      </div>
    </div>
  )
}

function PaymentOption({
  label,
  handle,
  href,
  icon,
}: {
  label: string
  handle: string
  href?: string
  icon: React.ReactNode
}) {
  const content = (
    <div className="flex items-start gap-3 h-full">
      {icon}
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
        <div className="text-neutral-100 font-medium mt-1 break-all">{handle}</div>
      </div>
    </div>
  )

  const className =
    "rounded-md border border-neutral-700 bg-neutral-950 p-3 block h-full" +
    (href ? " hover:border-amber-500 transition-colors" : "")

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return <div className={className}>{content}</div>
}

function VenmoIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0 rounded-lg" aria-hidden>
      <rect width="36" height="36" rx="8" fill="#3D95CE" />
      <text
        x="18"
        y="25"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="#ffffff"
      >
        V
      </text>
    </svg>
  )
}

function ZelleIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0 rounded-lg" aria-hidden>
      <rect width="36" height="36" rx="8" fill="#6D1ED4" />
      <text
        x="18"
        y="25"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        fill="#ffffff"
      >
        Z
      </text>
    </svg>
  )
}

function PaypalIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0 rounded-lg" aria-hidden>
      <rect width="36" height="36" rx="8" fill="#ffffff" />
      <text
        x="12"
        y="25"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="#003087"
      >
        P
      </text>
      <text
        x="22"
        y="25"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="#009cde"
      >
        P
      </text>
    </svg>
  )
}
