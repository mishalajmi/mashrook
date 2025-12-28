# =============================================================================
# Development Environment - Terraform Variables
# =============================================================================
# This file contains the variable values for the development environment.
# These values are optimized for development and testing purposes.
# =============================================================================

# -----------------------------------------------------------------------------
# General Configuration
# -----------------------------------------------------------------------------

environment  = "dev"
project_name = "mashrook"
aws_region   = "me-south-1"

# -----------------------------------------------------------------------------
# SMS Configuration
# -----------------------------------------------------------------------------

# Lower spend limit for development to prevent accidental overspending
monthly_spend_limit = 50

# Use Transactional for reliability even in dev
default_sms_type = "Transactional"

# Sender ID (may not work in all countries)
default_sender_id = "MASHROOK"

# -----------------------------------------------------------------------------
# Monitoring Configuration
# -----------------------------------------------------------------------------

# Lower threshold for dev to catch issues early
alarm_threshold_failures = 10

# Standard evaluation periods
alarm_evaluation_periods = 2

# 5 minute evaluation period
alarm_period_seconds = 300

# Alert when 80% of monthly spend is reached
spend_alarm_threshold_percentage = 80

# Set this to an SNS topic ARN to receive alarm notifications
# Example: "arn:aws:sns:me-south-1:123456789012:dev-alerts"
alarm_sns_topic_arn = ""

# -----------------------------------------------------------------------------
# Logging Configuration
# -----------------------------------------------------------------------------

# Shorter retention for dev to reduce costs (14 days)
log_retention_days = 14

# -----------------------------------------------------------------------------
# IAM Configuration
# -----------------------------------------------------------------------------

# Enable IAM user creation for simpler access key based authentication
enable_iam_user = true

# GCP cross-cloud configuration (optional)
# Set these if you need the backend to assume this role from GCP
gcp_service_account_id = ""
gcp_project_id         = ""

# -----------------------------------------------------------------------------
# Tags
# -----------------------------------------------------------------------------

tags = {
  CostCenter = "development"
  Team       = "engineering"
}
