import Image from "next/image"
import { OrderForm } from "@/components/OrderForm"
import { getLabelsContent, getPricingContent } from "@/lib/content"
import { EVENT_DATE_RANGE, EVENT_LOCATION, EVENT_NAME } from "@/lib/config"

export default function Home() {
  const pricing = getPricingContent()
  const labels = getLabelsContent()

  return (
    <div className="min-h-screen bg-black">
      <div className="relative w-full aspect-[2000/549]">
        <Image
          src="/camperween-hero.png"
          alt="Camperween band performing on stage in costume"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="py-10 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto mb-8">
          <h1 className="text-3xl font-bold text-neutral-100">{EVENT_NAME}</h1>
          <p className="text-neutral-400 mt-1">
            {EVENT_DATE_RANGE} &middot; {EVENT_LOCATION}
          </p>
          <p className="text-neutral-300 mt-4 max-w-3xl">
            We are very excited to invite you to Camperween 2026 for a second year at Camp Monte
            Toyon -- a woodsy camp that is 90 minutes from the East Bay / 60 min from Mountain
            View. This year with new and improved gourmet food!
          </p>
        </div>
        <div className="max-w-5xl mx-auto">
          <OrderForm pricing={pricing} labels={labels} />
        </div>
      </div>
    </div>
  )
}
