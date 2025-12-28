# =============================================================================
# SNS Notifications Module - Input Variables
# =============================================================================
# This file defines all input variables for the SNS notifications module.
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
# SMS Configuration
# -----------------------------------------------------------------------------

variable "monthly_spend_limit" {
  description = "Monthly SMS spending limit in USD. AWS will stop sending SMS when this limit is reached."
  type        = number
  default     = 100

  validation {
    condition     = var.monthly_spend_limit >= 1 && var.monthly_spend_limit <= 10000
    error_message = "Monthly spend limit must be between 1 and 10000 USD."
  }
}

variable "default_sms_type" {
  description = "Default SMS type: Transactional (higher reliability, higher cost) or Promotional (lower cost, best effort)"
  type        = string
  default     = "Transactional"

  validation {
    condition     = contains(["Transactional", "Promotional"], var.default_sms_type)
    error_message = "SMS type must be either 'Transactional' or 'Promotional'."
  }
}

variable "default_sender_id" {
  description = "Default sender ID for SMS messages (11 alphanumeric characters max). Not supported in all countries."
  type        = string
  default     = "MASHROOK"

  validation {
    condition     = can(regex("^[A-Za-z0-9]{1,11}$", var.default_sender_id))
    error_message = "Sender ID must be 1-11 alphanumeric characters."
  }
}

# -----------------------------------------------------------------------------
# Monitoring and Alerting
# -----------------------------------------------------------------------------

variable "alarm_threshold_failures" {
  description = "Number of SMS delivery failures that triggers a CloudWatch alarm"
  type        = number
  default     = 10

  validation {
    condition     = var.alarm_threshold_failures >= 1
    error_message = "Alarm threshold must be at least 1."
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

variable "spend_alarm_threshold_percentage" {
  description = "Percentage of monthly spend limit that triggers a warning alarm (0-100)"
  type        = number
  default     = 80

  validation {
    condition     = var.spend_alarm_threshold_percentage > 0 && var.spend_alarm_threshold_percentage <= 100
    error_message = "Spend alarm threshold must be between 1 and 100 percent."
  }
}

# -----------------------------------------------------------------------------
# Logging Configuration
# -----------------------------------------------------------------------------

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs for SMS delivery status"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention must be a valid CloudWatch Logs retention period."
  }
}

# -----------------------------------------------------------------------------
# Cross-Cloud Configuration (GCP Integration)
# -----------------------------------------------------------------------------

variable "gcp_service_account_id" {
  description = "GCP service account ID (numeric) that will assume the AWS IAM role for cross-cloud access. Leave empty to skip cross-cloud trust configuration."
  type        = string
  default     = ""
}

variable "gcp_project_id" {
  description = "GCP project ID where the service account resides"
  type        = string
  default     = ""
}

variable "enable_iam_user" {
  description = "Create an IAM user with access keys for simpler setup (alternative to cross-cloud IAM role assumption)"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Resource Tagging
# -----------------------------------------------------------------------------

variable "tags" {
  description = "Additional tags to apply to all resources created by this module"
  type        = map(string)
  default     = {}
}
