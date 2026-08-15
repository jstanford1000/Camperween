export const EVENT_NAME = "Camperween 2026"
export const EVENT_DATE_RANGE = "October 2-5, 2026"
export const EVENT_LOCATION = "Camp Monte Toyon, Aptos, CA"

export const PAYMENT_INSTRUCTIONS = {
  venmo: process.env.NEXT_PUBLIC_VENMO_HANDLE || "@Camperween-Crew",
  zelle: process.env.NEXT_PUBLIC_ZELLE_HANDLE || "camperween@example.com",
  paypal: process.env.NEXT_PUBLIC_PAYPAL_HANDLE || "@Camperween-Crew",
}
