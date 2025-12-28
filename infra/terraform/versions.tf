# =============================================================================
# Terraform and Provider Version Constraints
# =============================================================================
# This file defines the required Terraform version and provider versions.
# Version pinning ensures consistent behavior across team members and CI/CD.
# =============================================================================

terraform {
  required_version = ">= 1.6.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.31.0"
    }
  }
}
