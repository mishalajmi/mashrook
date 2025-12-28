# =============================================================================
# SNS Notifications Module - Main Configuration
# =============================================================================
# This module creates AWS SNS topics for the Mashrook notification system,
# including payment reminders and campaign updates with SMS delivery.
#
# Resources Created:
# - SNS Topics for payment reminders and campaign updates
# - SNS Topic Policies with least-privilege access
# - SMS Preferences for transactional messaging
# - CloudWatch Log Groups for delivery status logging
# - CloudWatch Alarms for monitoring failures and spend
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
      Module      = "sns-notifications"
    },
    var.tags
  )

  # Topic names
  payment_reminders_topic_name = "${var.project_name}-payment-reminders-${var.environment}"
  campaign_updates_topic_name  = "${var.project_name}-campaign-updates-${var.environment}"
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# SNS Topics
# -----------------------------------------------------------------------------

# Payment Reminders Topic - Used for invoice and payment reminder notifications
resource "aws_sns_topic" "payment_reminders" {
  name         = local.payment_reminders_topic_name
  display_name = "Mashrook Payment Reminders"

  # Enable server-side encryption using AWS managed key
  kms_master_key_id = "alias/aws/sns"

  # Delivery policy for HTTP/S endpoints (if used in future)
  delivery_policy = jsonencode({
    http = {
      defaultHealthyRetryPolicy = {
        minDelayTarget     = 20
        maxDelayTarget     = 20
        numRetries         = 3
        numMaxDelayRetries = 0
        numNoDelayRetries  = 0
        numMinDelayRetries = 0
        backoffFunction    = "linear"
      }
      disableSubscriptionOverrides = false
    }
  })

  tags = merge(local.common_tags, {
    Name    = local.payment_reminders_topic_name
    Purpose = "payment-reminders"
  })
}

# Campaign Updates Topic - Used for campaign status and grace period alerts
resource "aws_sns_topic" "campaign_updates" {
  name         = local.campaign_updates_topic_name
  display_name = "Mashrook Campaign Updates"

  # Enable server-side encryption using AWS managed key
  kms_master_key_id = "alias/aws/sns"

  # Delivery policy for HTTP/S endpoints (if used in future)
  delivery_policy = jsonencode({
    http = {
      defaultHealthyRetryPolicy = {
        minDelayTarget     = 20
        maxDelayTarget     = 20
        numRetries         = 3
        numMaxDelayRetries = 0
        numNoDelayRetries  = 0
        numMinDelayRetries = 0
        backoffFunction    = "linear"
      }
      disableSubscriptionOverrides = false
    }
  })

  tags = merge(local.common_tags, {
    Name    = local.campaign_updates_topic_name
    Purpose = "campaign-updates"
  })
}

# -----------------------------------------------------------------------------
# SNS Topic Policies
# -----------------------------------------------------------------------------

# Policy for Payment Reminders Topic - Only allow publisher role/user to publish
resource "aws_sns_topic_policy" "payment_reminders" {
  arn    = aws_sns_topic.payment_reminders.arn
  policy = data.aws_iam_policy_document.payment_reminders_topic_policy.json
}

data "aws_iam_policy_document" "payment_reminders_topic_policy" {
  # Allow the publisher role to publish messages
  statement {
    sid    = "AllowPublisherRolePublish"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.sns_publisher.arn]
    }

    actions = [
      "sns:Publish"
    ]

    resources = [aws_sns_topic.payment_reminders.arn]
  }

  # Allow the publisher IAM user to publish messages (if enabled)
  dynamic "statement" {
    for_each = var.enable_iam_user ? [1] : []
    content {
      sid    = "AllowPublisherUserPublish"
      effect = "Allow"

      principals {
        type        = "AWS"
        identifiers = [aws_iam_user.sns_publisher[0].arn]
      }

      actions = [
        "sns:Publish"
      ]

      resources = [aws_sns_topic.payment_reminders.arn]
    }
  }

  # Deny all other principals (explicit deny)
  statement {
    sid    = "DenyUnauthorizedAccess"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = [
      "sns:Publish",
      "sns:Subscribe",
      "sns:SetTopicAttributes",
      "sns:RemovePermission",
      "sns:AddPermission",
      "sns:DeleteTopic"
    ]

    resources = [aws_sns_topic.payment_reminders.arn]

    condition {
      test     = "StringNotEquals"
      variable = "aws:PrincipalArn"
      values = concat(
        [aws_iam_role.sns_publisher.arn],
        var.enable_iam_user ? [aws_iam_user.sns_publisher[0].arn] : [],
        # Allow root account for administrative purposes
        ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
      )
    }
  }
}

# Policy for Campaign Updates Topic - Only allow publisher role/user to publish
resource "aws_sns_topic_policy" "campaign_updates" {
  arn    = aws_sns_topic.campaign_updates.arn
  policy = data.aws_iam_policy_document.campaign_updates_topic_policy.json
}

data "aws_iam_policy_document" "campaign_updates_topic_policy" {
  # Allow the publisher role to publish messages
  statement {
    sid    = "AllowPublisherRolePublish"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.sns_publisher.arn]
    }

    actions = [
      "sns:Publish"
    ]

    resources = [aws_sns_topic.campaign_updates.arn]
  }

  # Allow the publisher IAM user to publish messages (if enabled)
  dynamic "statement" {
    for_each = var.enable_iam_user ? [1] : []
    content {
      sid    = "AllowPublisherUserPublish"
      effect = "Allow"

      principals {
        type        = "AWS"
        identifiers = [aws_iam_user.sns_publisher[0].arn]
      }

      actions = [
        "sns:Publish"
      ]

      resources = [aws_sns_topic.campaign_updates.arn]
    }
  }

  # Deny all other principals (explicit deny)
  statement {
    sid    = "DenyUnauthorizedAccess"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = [
      "sns:Publish",
      "sns:Subscribe",
      "sns:SetTopicAttributes",
      "sns:RemovePermission",
      "sns:AddPermission",
      "sns:DeleteTopic"
    ]

    resources = [aws_sns_topic.campaign_updates.arn]

    condition {
      test     = "StringNotEquals"
      variable = "aws:PrincipalArn"
      values = concat(
        [aws_iam_role.sns_publisher.arn],
        var.enable_iam_user ? [aws_iam_user.sns_publisher[0].arn] : [],
        # Allow root account for administrative purposes
        ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
      )
    }
  }
}

# -----------------------------------------------------------------------------
# SMS Preferences (Account-Level Settings)
# -----------------------------------------------------------------------------

resource "aws_sns_sms_preferences" "main" {
  # Transactional for reliability (higher cost but guaranteed delivery attempt)
  default_sms_type = var.default_sms_type

  # Monthly spending limit in USD - AWS stops sending when reached
  monthly_spend_limit = var.monthly_spend_limit

  # Default sender ID (may not work in all countries)
  default_sender_id = var.default_sender_id

  # IAM role for CloudWatch delivery status logging
  delivery_status_iam_role_arn = aws_iam_role.sns_delivery_status.arn

  # Sample rate for successful deliveries (100% for full visibility)
  delivery_status_success_sampling_rate = 100

  # Usage report S3 bucket (optional - not configured to reduce complexity)
  # usage_report_s3_bucket = ""
}

# -----------------------------------------------------------------------------
# CloudWatch Log Groups
# -----------------------------------------------------------------------------

# Log group for SMS delivery status (success and failure)
resource "aws_cloudwatch_log_group" "sns_sms_delivery" {
  name              = "/aws/sns/${local.name_prefix}/sms-delivery"
  retention_in_days = var.log_retention_days

  # Enable encryption at rest using default CloudWatch Logs encryption
  # For custom KMS key, uncomment and configure:
  # kms_key_id = aws_kms_key.logs.arn

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-sms-delivery-logs"
    Purpose = "sns-delivery-logging"
  })
}

# Log group for direct SMS publish operations
resource "aws_cloudwatch_log_group" "sns_direct_publish" {
  name              = "/aws/sns/${local.name_prefix}/direct-publish"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-direct-publish-logs"
    Purpose = "sns-direct-publish-logging"
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Alarms
# -----------------------------------------------------------------------------

# Alarm for SMS delivery failures exceeding threshold
resource "aws_cloudwatch_metric_alarm" "sms_delivery_failures" {
  alarm_name          = "${local.name_prefix}-sms-delivery-failures"
  alarm_description   = "Alarm when SMS delivery failures exceed ${var.alarm_threshold_failures} in ${var.alarm_evaluation_periods} periods"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "NumberOfNotificationsFailed"
  namespace           = "AWS/SNS"
  period              = var.alarm_period_seconds
  statistic           = "Sum"
  threshold           = var.alarm_threshold_failures
  treat_missing_data  = "notBreaching"

  # Dimensions to scope to SMS delivery
  dimensions = {
    # Note: SMS metrics don't have topic-specific dimensions at account level
    # This alarm monitors all SMS failures in the account
  }

  # Actions when alarm triggers
  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  ok_actions    = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-sms-delivery-failures-alarm"
    Purpose = "monitoring"
  })
}

# Alarm for spend approaching monthly limit
resource "aws_cloudwatch_metric_alarm" "sms_spend_warning" {
  alarm_name          = "${local.name_prefix}-sms-spend-warning"
  alarm_description   = "Alarm when SMS spend reaches ${var.spend_alarm_threshold_percentage}% of monthly limit ($${var.monthly_spend_limit})"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "SMSMonthToDateSpentUSD"
  namespace           = "AWS/SNS"
  period              = 300
  statistic           = "Maximum"
  threshold           = var.monthly_spend_limit * (var.spend_alarm_threshold_percentage / 100)
  treat_missing_data  = "notBreaching"

  # Actions when alarm triggers
  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-sms-spend-warning-alarm"
    Purpose = "cost-monitoring"
  })
}

# Alarm for payment reminders topic - messages published (tracking usage)
resource "aws_cloudwatch_metric_alarm" "payment_reminders_published" {
  alarm_name          = "${local.name_prefix}-payment-reminders-no-activity"
  alarm_description   = "Alarm when no messages are published to payment reminders topic for extended period (potential issue)"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 24  # 24 periods of 1 hour = 24 hours
  metric_name         = "NumberOfMessagesPublished"
  namespace           = "AWS/SNS"
  period              = 3600  # 1 hour
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "breaching"

  dimensions = {
    TopicName = aws_sns_topic.payment_reminders.name
  }

  # Only alert in production (dev may have periods of inactivity)
  actions_enabled = var.environment == "prod"
  alarm_actions   = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-payment-reminders-activity-alarm"
    Purpose = "monitoring"
  })
}
