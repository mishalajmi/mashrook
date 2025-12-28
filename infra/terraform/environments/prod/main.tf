# =============================================================================
# Production Environment - Main Configuration
# =============================================================================
# This file configures the notification infrastructure for the production
# environment with production-grade settings, including:
# - SNS notifications for SMS messaging
# - SES email for invoice notifications, payment reminders, and campaign updates
# =============================================================================

terraform {
  required_version = ">= 1.6.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.31.0"
    }
  }

  # Remote state configuration
  # Note: The S3 bucket and DynamoDB table must be created before running terraform init
  # See /infra/terraform/backend.tf for bootstrap instructions
  backend "s3" {
    bucket         = "mashrook-terraform-state"
    key            = "sns-notifications/prod/terraform.tfstate"
    region         = "me-south-1"
    dynamodb_table = "mashrook-terraform-locks"
    encrypt        = true
  }
}

# -----------------------------------------------------------------------------
# AWS Provider Configuration
# -----------------------------------------------------------------------------

provider "aws" {
  region = var.aws_region

  # Default tags applied to all resources
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "mashrook"
    }
  }
}

# -----------------------------------------------------------------------------
# SNS Notifications Module
# -----------------------------------------------------------------------------

module "sns_notifications" {
  source = "../../modules/sns-notifications"

  # General configuration
  environment  = var.environment
  project_name = var.project_name
  aws_region   = var.aws_region

  # SMS configuration - higher limits for production
  monthly_spend_limit = var.monthly_spend_limit
  default_sms_type    = var.default_sms_type
  default_sender_id   = var.default_sender_id

  # Monitoring - production-appropriate thresholds
  alarm_threshold_failures         = var.alarm_threshold_failures
  alarm_evaluation_periods         = var.alarm_evaluation_periods
  alarm_period_seconds             = var.alarm_period_seconds
  alarm_sns_topic_arn              = var.alarm_sns_topic_arn
  spend_alarm_threshold_percentage = var.spend_alarm_threshold_percentage

  # Logging - longer retention for production compliance
  log_retention_days = var.log_retention_days

  # IAM configuration
  enable_iam_user        = var.enable_iam_user
  gcp_service_account_id = var.gcp_service_account_id
  gcp_project_id         = var.gcp_project_id

  # Additional tags
  tags = var.tags
}

# -----------------------------------------------------------------------------
# SES Email Module
# -----------------------------------------------------------------------------

module "ses_email" {
  source = "../../modules/ses-email"

  # General configuration
  environment  = var.environment
  project_name = var.project_name
  aws_region   = var.aws_region

  # Domain configuration
  domain_name                = var.ses_domain_name
  enable_domain_verification = var.ses_enable_domain_verification
  enable_custom_mail_from    = var.ses_enable_custom_mail_from

  # Email identities for production
  enable_email_identities = var.ses_enable_email_identities
  email_identities        = var.ses_email_identities

  # SNS integration - can use existing SNS topics for unified handling
  enable_sns_notifications = var.ses_enable_sns_notifications
  bounce_topic_arn         = var.ses_bounce_topic_arn
  complaint_topic_arn      = var.ses_complaint_topic_arn

  # Monitoring - production thresholds (stricter to maintain reputation)
  bounce_rate_threshold    = var.ses_bounce_rate_threshold
  complaint_rate_threshold = var.ses_complaint_rate_threshold
  daily_sending_quota      = var.ses_daily_sending_quota
  alarm_sns_topic_arn      = var.alarm_sns_topic_arn

  # Logging - longer retention for production compliance
  log_retention_days = var.log_retention_days

  # IAM configuration
  enable_iam_user         = var.ses_enable_iam_user
  enable_smtp_credentials = var.ses_enable_smtp_credentials
  gcp_service_account_id  = var.gcp_service_account_id
  gcp_project_id          = var.gcp_project_id

  # Additional tags
  tags = var.tags
}
