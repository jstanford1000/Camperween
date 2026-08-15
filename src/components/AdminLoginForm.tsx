"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { adminLogin } from "@/app/actions"

export function AdminLoginForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const ok = await adminLogin(password)
    if (ok) {
      router.push("/admin/dashboard")
      router.refresh()
    } else {
      setError("Incorrect password.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-24 space-y-4">
      <h1 className="text-xl font-semibold text-neutral-100">Camperween admin</h1>
      <input
        type="password"
        autoFocus
        className="input"
        placeholder="Admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold py-2.5"
      >
        {submitting ? "Checking..." : "Log in"}
      </button>
    </form>
  )
}
