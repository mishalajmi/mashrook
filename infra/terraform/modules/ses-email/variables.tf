# =============================================================================
# SES Email Module - Input Variables
# =============================================================================
# This file defines all input variables for the SES email module.
# Variables are grouped by function and include validation where appropriate.
# =============================================================================

# -----------------------------------------------------------------------------
# General Configuration
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "mashrook"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,20}$", var.project_name))
    error_message = "Project name must start with a letter, contain only lowercase letters, numbers, and hyphens, and be 2-21 characters long."
  }
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "me-south-1"
}

# -----------------------------------------------------------------------------
# Domain Configuration
# -----------------------------------------------------------------------------

variable "domain_name" {
  description = "Domain name for SES email sending (e.g., mashrook.sa)"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}$", var.domain_name))
    error_message = "Domain name must be a valid domain format (e.g., example.com or sub.example.com)."
  }
}

variable "enable_domain_verification" {
  description = "Enable domain verification (set to false if DNS records are not yet configured)"
  type        = bool
  default     = false
}

variable "enable_custom_mail_from" {
  description = "Enable custom MAIL FROM domain (requires additional DNS MX record)"
  type        = bool
  default     = true
}

variable "mail_from_behavior_on_failure" {
  description = "Behavior when MAIL FROM domain verification fails: REJECT_MESSAGE or USE_DEFAULT_VALUE"
  type        = string
  default     = "USE_DEFAULT_VALUE"

  validation {
    condition     = contains(["REJECT_MESSAGE", "USE_DEFAULT_VALUE"], var.mail_from_behavior_on_failure)
    error_message = "mail_from_behavior_on_failure must be either 'REJECT_MESSAGE' or 'USE_DEFAULT_VALUE'."
  }
}

# -----------------------------------------------------------------------------
# Email Identity Configuration
# -----------------------------------------------------------------------------

variable "enable_email_identities" {
  description = "Enable creation of individual email identities"
  type        = bool
  default     = true
}

variable "email_identities" {
  description = "List of email addresses to register as verified senders"
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for email in var.email_identities : can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", email))
    ])
    error_message = "All email identities must be valid email addresses."
  }
}

# -----------------------------------------------------------------------------
# Configuration Set Options
# -----------------------------------------------------------------------------

variable "enable_reputation_metrics" {
  description = "Enable reputation metrics tracking (bounces, complaints)"
  type        = bool
  default     = true
}

variable "sending_enabled" {
  description = "Enable email sending through this configuration set"
  type        = bool
  default     = true
}

variable "tls_policy" {
  description = "TLS policy for outbound emails: REQUIRE or OPTIONAL"
  type        = string
  default     = "REQUIRE"

  validation {
    condition     = contains(["REQUIRE", "OPTIONAL"], var.tls_policy)
    error_message = "TLS policy must be either 'REQUIRE' or 'OPTIONAL'."
  }
}

variable "enable_open_click_tracking" {
  description = "Enable open and click tracking for emails"
  type        = bool
  default     = false
}

variable "custom_tracking_domain" {
  description = "Custom domain for open/click tracking (requires CNAME DNS record)"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# CloudWatch Event Configuration
# -----------------------------------------------------------------------------

variable "cloudwatch_event_types" {
  description = "List of SES event types to send to CloudWatch"
  type        = list(string)
  default = [
    "send",
    "reject",
    "bounce",
    "complaint",
    "delivery",
    "deliveryDelay",
    "renderingFailure"
  ]

  validation {
    condition = alltrue([
      for event in var.cloudwatch_event_types : contains([
        "send", "reject", "bounce", "complaint", "delivery",
        "open", "click", "renderingFailure", "deliveryDelay", "subscription"
      ], event)
    ])
    error_message = "Invalid event type. Must be one of: send, reject, bounce, complaint, delivery, open, click, renderingFailure, deliveryDelay, subscription."
  }
}

# -----------------------------------------------------------------------------
# SNS Integration for Bounce/Complaint Handling
# -----------------------------------------------------------------------------

variable "enable_sns_notifications" {
  description = "Enable SNS notifications for bounces and complaints"
  type        = bool
  default     = true
}

variable "bounce_topic_arn" {
  description = "ARN of existing SNS topic for bounce notifications. If empty, a new topic will be created."
  type        = string
  default     = ""
}

variable "complaint_topic_arn" {
  description = "ARN of existing SNS topic for complaint notifications. If empty, a new topic will be created."
  type        = string
  default     = ""
}

variable "delivery_topic_arn" {
  description = "ARN of existing SNS topic for delivery notifications. If empty, no delivery notifications will be sent."
  type        = string
  default     = ""
}

variable "include_original_headers" {
  description = "Include original email headers in SNS notifications"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Monitoring and Alerting
# -----------------------------------------------------------------------------

variable "bounce_rate_threshold" {
  description = "Bounce rate percentage that triggers a CloudWatch alarm (AWS recommends < 5%)"
  type        = number
  default     = 5

  validation {
    condition     = var.bounce_rate_threshold > 0 && var.bounce_rate_threshold <= 100
    error_message = "Bounce rate threshold must be between 0 and 100 percent."
  }
}

variable "complaint_rate_threshold" {
  description = "Complaint rate percentage that triggers a CloudWatch alarm (AWS recommends < 0.1%)"
  type        = number
  default     = 0.1

  validation {
    condition     = var.complaint_rate_threshold > 0 && var.complaint_rate_threshold <= 100
    error_message = "Complaint rate threshold must be between 0 and 100 percent."
  }
}

variable "daily_sending_quota" {
  description = "Expected daily sending quota (used for quota usage alarm calculation)"
  type        = number
  default     = 10000

  validation {
    condition     = var.daily_sending_quota > 0
    error_message = "Daily sending quota must be a positive number."
  }
}

variable "sending_quota_threshold" {
  description = "Percentage of daily sending quota that triggers a warning alarm"
  type        = number
  default     = 80

  validation {
    condition     = var.sending_quota_threshold > 0 && var.sending_quota_threshold <= 100
    error_message = "Sending quota threshold must be between 1 and 100 percent."
  }
}

variable "alarm_evaluation_periods" {
  description = "Number of periods to evaluate for the alarm"
  type        = number
  default     = 2
}

variable "alarm_period_seconds" {
  description = "The period in seconds over which the statistic is applied"
  type        = number
  default     = 300

  validation {
    condition     = contains([60, 300, 900, 3600], var.alarm_period_seconds)
    error_message = "Alarm period must be 60, 300, 900, or 3600 seconds."
  }
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarm notifications. If empty, alarms will not send notifications."
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Logging Configuration
# -----------------------------------------------------------------------------

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs for SES events"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention must be a valid CloudWatch Logs retention period."
  }
}

# -----------------------------------------------------------------------------
# IAM Configuration
# -----------------------------------------------------------------------------

variable "enable_iam_user" {
  description = "Create an IAM user with access keys for SES sending"
  type        = bool
  default     = true
}

variable "enable_smtp_credentials" {
  description = "Generate SMTP credentials for the IAM user (for SMTP-based email sending)"
  type        = bool
  default     = true
}

variable "gcp_service_account_id" {
  description = "GCP service account ID (numeric) that will assume the AWS IAM role for cross-cloud access"
  type        = string
  default     = ""
}

variable "gcp_project_id" {
  description = "GCP project ID where the service account resides"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Suppression List Configuration
# -----------------------------------------------------------------------------

variable "enable_account_level_suppression" {
  description = "Enable account-level suppression list (automatically removes bounces/complaints)"
  type        = bool
  default     = true
}

variable "suppression_list_reasons" {
  description = "Reasons for adding addresses to suppression list: BOUNCE, COMPLAINT, or both"
  type        = list(string)
  default     = ["BOUNCE", "COMPLAINT"]

  validation {
    condition = alltrue([
      for reason in var.suppression_list_reasons : contains(["BOUNCE", "COMPLAINT"], reason)
    ])
    error_message = "Suppression list reasons must be 'BOUNCE' and/or 'COMPLAINT'."
  }
}

# -----------------------------------------------------------------------------
# Resource Tagging
# -----------------------------------------------------------------------------

variable "tags" {
  description = "Additional tags to apply to all resources created by this module"
  type        = map(string)
  default     = {}
}
