import { redirect } from "next/navigation"
import { isAdminAuthed } from "@/app/actions"
import { AdminLoginForm } from "@/components/AdminLoginForm"

export default async function AdminPage() {
  if (await isAdminAuthed()) {
    redirect("/admin/dashboard")
  }
  return (
    <div className="min-h-screen bg-black px-4">
      <AdminLoginForm />
    </div>
  )
}
