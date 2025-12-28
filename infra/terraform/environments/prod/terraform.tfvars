# =============================================================================
# Production Environment - Terraform Variables
# =============================================================================
# This file contains the variable values for the production environment.
# These values are optimized for production reliability, compliance, and scale.
#
# IMPORTANT: Review all values before applying to production.
# =============================================================================

# -----------------------------------------------------------------------------
# General Configuration
# -----------------------------------------------------------------------------

environment  = "prod"
project_name = "mashrook"
aws_region   = "me-south-1"

# -----------------------------------------------------------------------------
# SMS Configuration
# -----------------------------------------------------------------------------

# Higher spend limit for production traffic
monthly_spend_limit = 500

# Use Transactional for maximum reliability
default_sms_type = "Transactional"

# Sender ID (may not work in all countries)
default_sender_id = "MASHROOK"

# -----------------------------------------------------------------------------
# Monitoring Configuration
# -----------------------------------------------------------------------------

# Higher threshold for production (more tolerance for normal variance)
alarm_threshold_failures = 50

# Standard evaluation periods
alarm_evaluation_periods = 2

# 5 minute evaluation period
alarm_period_seconds = 300

# Alert earlier in production (70% vs 80% for dev)
spend_alarm_threshold_percentage = 70

# Set this to an SNS topic ARN to receive alarm notifications
# IMPORTANT: Configure this for production alerting!
# Example: "arn:aws:sns:me-south-1:123456789012:prod-alerts"
alarm_sns_topic_arn = ""

# -----------------------------------------------------------------------------
# Logging Configuration
# -----------------------------------------------------------------------------

# Longer retention for production compliance (90 days)
log_retention_days = 90

# -----------------------------------------------------------------------------
# IAM Configuration
# -----------------------------------------------------------------------------

# Enable IAM user creation for simpler access key based authentication
enable_iam_user = true

# GCP cross-cloud configuration
# Set these if your backend on GCP needs to assume this role
# Example:
# gcp_service_account_id = "123456789012345678901"
# gcp_project_id = "mashrook-prod"
gcp_service_account_id = ""
gcp_project_id         = ""

# -----------------------------------------------------------------------------
# Tags
# -----------------------------------------------------------------------------

tags = {
  CostCenter  = "production"
  Team        = "engineering"
  Compliance  = "pci-dss"
  DataClass   = "confidential"
}
