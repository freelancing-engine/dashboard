output "dashboard_url" {
  description = "Production URL of the dashboard"
  value       = "https://${vercel_project.dashboard.name}.vercel.app"
}

output "project_id" {
  description = "Vercel project ID"
  value       = vercel_project.dashboard.id
}
