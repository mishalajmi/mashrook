# =============================================================================
# Production Environment - Variable Definitions
# =============================================================================
# This file defines variables for the production environment.
# Default values are optimized for production reliability and compliance.
# =============================================================================

# -----------------------------------------------------------------------------
# General Configuration
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Deployment environment identifier"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "mashrook"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "me-south-1"
}

# -----------------------------------------------------------------------------
# SMS Configuration
# -----------------------------------------------------------------------------

variable "monthly_spend_limit" {
  description = "Monthly SMS spending limit in USD"
  type        = number
  default     = 500
}

variable "default_sms_type" {
  description = "Default SMS type (Transactional or Promotional)"
  type        = string
  default     = "Transactional"
}

variable "default_sender_id" {
  description = "Default sender ID for SMS messages"
  type        = string
  default     = "MASHROOK"
}

# -----------------------------------------------------------------------------
# Monitoring Configuration
# -----------------------------------------------------------------------------

variable "alarm_threshold_failures" {
  description = "Number of SMS delivery failures that triggers an alarm"
  type        = number
  default     = 50
}

variable "alarm_evaluation_periods" {
  description = "Number of evaluation periods for alarms"
  type        = number
  default     = 2
}

variable "alarm_period_seconds" {
  description = "Period in seconds for alarm evaluation"
  type        = number
  default     = 300
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications"
  type        = string
  default     = ""
}

variable "spend_alarm_threshold_percentage" {
  description = "Percentage of monthly limit that triggers spend warning"
  type        = number
  default     = 70
}

# -----------------------------------------------------------------------------
# Logging Configuration
# -----------------------------------------------------------------------------

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 90
}

# -----------------------------------------------------------------------------
# IAM Configuration
# -----------------------------------------------------------------------------

variable "enable_iam_user" {
  description = "Create IAM user with access keys"
  type        = bool
  default     = true
}

variable "gcp_service_account_id" {
  description = "GCP service account ID for cross-cloud access"
  type        = string
  default     = ""
}

variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# SES Email Configuration
# -----------------------------------------------------------------------------

variable "ses_domain_name" {
  description = "Domain name for SES email sending"
  type        = string
  default     = "mashrook.sa"
}

variable "ses_enable_domain_verification" {
  description = "Enable domain verification (set to true after DNS records are configured)"
  type        = bool
  default     = false
}

variable "ses_enable_custom_mail_from" {
  description = "Enable custom MAIL FROM domain"
  type        = bool
  default     = true
}

variable "ses_enable_email_identities" {
  description = "Enable individual email identity verification"
  type        = bool
  default     = true
}

variable "ses_email_identities" {
  description = "List of email addresses to verify as senders"
  type        = list(string)
  default = [
    "notifications@mashrook.sa",
    "invoices@mashrook.sa",
    "campaigns@mashrook.sa",
    "support@mashrook.sa"
  ]
}

variable "ses_enable_sns_notifications" {
  description = "Enable SNS notifications for bounces and complaints"
  type        = bool
  default     = true
}

variable "ses_bounce_topic_arn" {
  description = "Existing SNS topic ARN for bounce notifications (leave empty to create new)"
  type        = string
  default     = ""
}

variable "ses_complaint_topic_arn" {
  description = "Existing SNS topic ARN for complaint notifications (leave empty to create new)"
  type        = string
  default     = ""
}

variable "ses_bounce_rate_threshold" {
  description = "Bounce rate percentage that triggers an alarm (AWS recommends < 5%)"
  type        = number
  default     = 3
}

variable "ses_complaint_rate_threshold" {
  description = "Complaint rate percentage that triggers an alarm (AWS recommends < 0.1%)"
  type        = number
  default     = 0.05
}

variable "ses_daily_sending_quota" {
  description = "Expected daily email sending quota"
  type        = number
  default     = 50000
}

variable "ses_enable_iam_user" {
  description = "Create IAM user with access keys for SES"
  type        = bool
  default     = true
}

variable "ses_enable_smtp_credentials" {
  description = "Generate SMTP credentials for email sending"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Tags
# -----------------------------------------------------------------------------

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
