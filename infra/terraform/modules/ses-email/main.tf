# =============================================================================
# SES Email Module - Main Configuration
# =============================================================================
# This module configures AWS SES for the Mashrook notification system,
# providing email infrastructure for invoice notifications, payment reminders,
# and campaign status updates.
#
# Resources Created:
# - SES Domain Identity with verification
# - DKIM Configuration for email authentication
# - Email Identity for sending emails
# - SES Configuration Set for tracking and reputation management
# - CloudWatch Event Destinations for email metrics
# =============================================================================

# -----------------------------------------------------------------------------
# Local Values
# -----------------------------------------------------------------------------

locals {
  # Resource naming convention: {project}-{resource}-{environment}
  name_prefix = "${var.project_name}-${var.environment}"

  # Common tags applied to all resources
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Module      = "ses-email"
    },
    var.tags
  )

  # Configuration set name
  configuration_set_name = "${var.project_name}-email-config-${var.environment}"

  # Email identities to create (from address patterns)
  email_identities = var.enable_email_identities ? var.email_identities : []
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# SES Domain Identity
# -----------------------------------------------------------------------------
# The domain identity allows sending emails from any address @domain

resource "aws_ses_domain_identity" "main" {
  domain = var.domain_name
}

# Domain verification - outputs a TXT record that must be added to DNS
resource "aws_ses_domain_identity_verification" "main" {
  count = var.enable_domain_verification ? 1 : 0

  domain = aws_ses_domain_identity.main.id

  # Wait for the domain verification to propagate
  # This depends on the DNS TXT record being created externally
  depends_on = [aws_ses_domain_identity.main]

  # Note: This resource will fail if the DNS verification record is not present
  # In practice, you'll need to:
  # 1. Apply terraform to get the verification token
  # 2. Add the TXT record to your DNS provider
  # 3. Re-apply terraform for verification to succeed
}

# -----------------------------------------------------------------------------
# DKIM Configuration
# -----------------------------------------------------------------------------
# DomainKeys Identified Mail (DKIM) provides email authentication
# and improves email deliverability

resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

# -----------------------------------------------------------------------------
# Mail From Domain Configuration
# -----------------------------------------------------------------------------
# Custom MAIL FROM domain for better deliverability and branding

resource "aws_ses_domain_mail_from" "main" {
  count = var.enable_custom_mail_from ? 1 : 0

  domain           = aws_ses_domain_identity.main.domain
  mail_from_domain = "mail.${var.domain_name}"

  # Behavior when MAIL FROM verification fails
  # REJECT_MESSAGE: Reject the email
  # USE_DEFAULT_VALUE: Use default amazonses.com domain
  behavior_on_mx_failure = var.mail_from_behavior_on_failure
}

# -----------------------------------------------------------------------------
# SES Email Identities
# -----------------------------------------------------------------------------
# Individual email addresses that can send emails (useful for specific senders)

resource "aws_ses_email_identity" "senders" {
  for_each = toset(local.email_identities)

  email = each.value
}

# -----------------------------------------------------------------------------
# SES Configuration Set
# -----------------------------------------------------------------------------
# Configuration sets enable tracking of email metrics and events

resource "aws_ses_configuration_set" "main" {
  name = local.configuration_set_name

  # Reputation metrics - tracks bounces and complaints
  reputation_metrics_enabled = var.enable_reputation_metrics

  # Sending enabled - can be used to pause sending
  sending_enabled = var.sending_enabled

  # Delivery options
  delivery_options {
    # TLS policy for email delivery
    tls_policy = var.tls_policy
  }

  # Tracking options for open and click tracking
  dynamic "tracking_options" {
    for_each = var.enable_open_click_tracking ? [1] : []
    content {
      custom_redirect_domain = var.custom_tracking_domain != "" ? var.custom_tracking_domain : null
    }
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Event Destination
# -----------------------------------------------------------------------------
# Send email events (bounces, complaints, deliveries) to CloudWatch

resource "aws_ses_event_destination" "cloudwatch" {
  name                   = "${local.name_prefix}-cloudwatch"
  configuration_set_name = aws_ses_configuration_set.main.name
  enabled                = true

  # Events to track
  matching_types = var.cloudwatch_event_types

  cloudwatch_destination {
    # Dimension for aggregating metrics
    default_value  = var.environment
    dimension_name = "Environment"
    value_source   = "messageTag"
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Log Group for SES Events
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "ses_events" {
  name              = "/aws/ses/${local.name_prefix}/events"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-ses-events-logs"
    Purpose = "ses-event-logging"
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Alarms
# -----------------------------------------------------------------------------

# Alarm for high bounce rate
resource "aws_cloudwatch_metric_alarm" "bounce_rate" {
  alarm_name          = "${local.name_prefix}-ses-bounce-rate"
  alarm_description   = "Alarm when SES bounce rate exceeds ${var.bounce_rate_threshold}%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Reputation.BounceRate"
  namespace           = "AWS/SES"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.bounce_rate_threshold / 100 # Convert percentage to decimal
  treat_missing_data  = "notBreaching"

  # Note: SES reputation metrics are at account level, not configuration set level
  # No dimensions needed for account-level metrics

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  ok_actions    = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-bounce-rate-alarm"
    Purpose = "monitoring"
  })
}

# Alarm for high complaint rate
resource "aws_cloudwatch_metric_alarm" "complaint_rate" {
  alarm_name          = "${local.name_prefix}-ses-complaint-rate"
  alarm_description   = "Alarm when SES complaint rate exceeds ${var.complaint_rate_threshold}%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Reputation.ComplaintRate"
  namespace           = "AWS/SES"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.complaint_rate_threshold / 100 # Convert percentage to decimal
  treat_missing_data  = "notBreaching"

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  ok_actions    = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-complaint-rate-alarm"
    Purpose = "monitoring"
  })
}

# Alarm for sending quota usage
resource "aws_cloudwatch_metric_alarm" "sending_quota" {
  alarm_name          = "${local.name_prefix}-ses-sending-quota"
  alarm_description   = "Alarm when SES sending approaches quota (${var.sending_quota_threshold}% of limit)"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Send"
  namespace           = "AWS/SES"
  period              = 86400 # 24 hours
  statistic           = "Sum"
  # This threshold would need to be calculated based on actual quota
  # For now, using a placeholder that should be updated based on account limits
  threshold          = var.daily_sending_quota * (var.sending_quota_threshold / 100)
  treat_missing_data = "notBreaching"

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-sending-quota-alarm"
    Purpose = "cost-monitoring"
  })
}
