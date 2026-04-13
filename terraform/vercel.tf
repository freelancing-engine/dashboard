# ── Vercel Project ────────────────────────────────────────────
resource "vercel_project" "dashboard" {
  name      = "freelancing-engine-dashboard"
  framework = "nextjs"
  team_id   = var.vercel_org_id

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = var.production_branch
  }

  build_command    = "npm run build"
  install_command  = "npm ci --legacy-peer-deps"
  output_directory = ".next"

  root_directory = null # repo root

  # Auto-deploy on push to production branch
  git_comments = {
    on_pull_request = true
    on_commit       = true
  }

  serverless_function_region = "gru1" # São Paulo — matches Neon region for lowest latency

  # ── Environment Variables (Production) ──────────────────────

  environment = [
    {
      key    = "DATABASE_URL"
      value  = var.database_url
      target = ["production", "preview"]
    },
    {
      key    = "DATABASE_SSL"
      value  = "true"
      target = ["production", "preview"]
    },
    {
      key    = "N8N_WEBHOOK_URL"
      value  = var.n8n_webhook_url
      target = ["production", "preview"]
    },
    {
      key    = "NEXT_PUBLIC_AGENT_SERVICE_URL"
      value  = var.agent_service_url
      target = ["production", "preview"]
    },
    {
      key    = "NEXT_PUBLIC_AGENT_SERVICE_TOKEN"
      value  = var.agent_service_token
      target = ["production", "preview"]
    },
  ]
}

# Note: Deployments happen automatically via git integration.
# First deploy will trigger when Vercel connects to the GitHub repo.
