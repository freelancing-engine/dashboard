terraform {
  required_version = ">= 1.5"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 2.0"
    }
  }
}

provider "vercel" {
  # Set VERCEL_API_TOKEN env var or use: vercel login → vercel token
  api_token = var.vercel_api_token
}
