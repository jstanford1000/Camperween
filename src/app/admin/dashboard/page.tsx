import { redirect } from "next/navigation"
import { getAllOrders, isAdminAuthed } from "@/app/actions"
import { getLabelsContent, getPricingContent } from "@/lib/content"
import { AdminDashboard } from "@/components/AdminDashboard"

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin")
  }
  const orders = await getAllOrders()
  const pricing = getPricingContent()
  const labels = getLabelsContent()
  return <AdminDashboard orders={orders} pricing={pricing} labels={labels} />
}
