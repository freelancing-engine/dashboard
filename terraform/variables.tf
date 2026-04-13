# ── Variables ─────────────────────────────────────────────────

variable "vercel_api_token" {
  description = "Vercel API token (from https://vercel.com/account/tokens)"
  type        = string
  sensitive   = true
}

variable "vercel_org_id" {
  description = "Vercel team/org ID (optional for personal accounts)"
  type        = string
  default     = null
}

variable "github_repo" {
  description = "GitHub repo in org/repo format"
  type        = string
  default     = "freelancing-engine/dashboard"
}

variable "production_branch" {
  description = "Branch that triggers production deploys"
  type        = string
  default     = "main"
}

# ── Database ──────────────────────────────────────────────────

variable "database_url" {
  description = "PostgreSQL connection string (Neon pooler URL recommended)"
  type        = string
  sensitive   = true
}

# ── n8n ───────────────────────────────────────────────────────

variable "n8n_webhook_url" {
  description = "Base URL for n8n webhooks (e.g. https://n8n.fly.dev/webhook)"
  type        = string
  default     = "http://n8n:5678/webhook"
}

# ── Agent Service ─────────────────────────────────────────────

variable "agent_service_url" {
  description = "Agent service base URL"
  type        = string
  default     = "http://localhost:8000"
}

variable "agent_service_token" {
  description = "Bearer token for agent-service auth"
  type        = string
  sensitive   = true
  default     = ""
}
