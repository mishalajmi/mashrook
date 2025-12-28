# =============================================================================
# SES Email Module - SNS Integration for Bounce/Complaint Handling
# =============================================================================
# This file configures SNS topics and SES notification settings for:
# - Bounce notifications (hard and soft bounces)
# - Complaint notifications (spam reports)
# - Delivery notifications (optional)
#
# The module supports both:
# 1. Using existing SNS topics (from sns-notifications module)
# 2. Creating new dedicated topics for SES notifications
# =============================================================================

# -----------------------------------------------------------------------------
# SNS Topics for SES Notifications
# -----------------------------------------------------------------------------
# These topics are created only if external topic ARNs are not provided

# Bounce notifications topic
resource "aws_sns_topic" "bounces" {
  count = var.enable_sns_notifications && var.bounce_topic_arn == "" ? 1 : 0

  name         = "${var.project_name}-ses-bounces-${var.environment}"
  display_name = "Mashrook SES Bounces"

  # Enable server-side encryption
  kms_master_key_id = "alias/aws/sns"

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-ses-bounces-${var.environment}"
    Purpose = "ses-bounce-notifications"
  })
}

# Complaint notifications topic
resource "aws_sns_topic" "complaints" {
  count = var.enable_sns_notifications && var.complaint_topic_arn == "" ? 1 : 0

  name         = "${var.project_name}-ses-complaints-${var.environment}"
  display_name = "Mashrook SES Complaints"

  # Enable server-side encryption
  kms_master_key_id = "alias/aws/sns"

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-ses-complaints-${var.environment}"
    Purpose = "ses-complaint-notifications"
  })
}

# -----------------------------------------------------------------------------
# SNS Topic Policies
# -----------------------------------------------------------------------------
# Allow SES to publish to the notification topics

# Policy for bounce topic (only if we created it)
resource "aws_sns_topic_policy" "bounces" {
  count = var.enable_sns_notifications && var.bounce_topic_arn == "" ? 1 : 0

  arn    = aws_sns_topic.bounces[0].arn
  policy = data.aws_iam_policy_document.ses_sns_publish_bounces[0].json
}

data "aws_iam_policy_document" "ses_sns_publish_bounces" {
  count = var.enable_sns_notifications && var.bounce_topic_arn == "" ? 1 : 0

  # Allow SES to publish bounce notifications
  statement {
    sid    = "AllowSESPublish"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ses.amazonaws.com"]
    }

    actions = ["sns:Publish"]

    resources = [aws_sns_topic.bounces[0].arn]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_ses_domain_identity.main.arn]
    }
  }

  # Allow the account root to manage the topic
  statement {
    sid    = "AllowAccountManagement"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = [
      "sns:GetTopicAttributes",
      "sns:SetTopicAttributes",
      "sns:AddPermission",
      "sns:RemovePermission",
      "sns:DeleteTopic",
      "sns:Subscribe",
      "sns:ListSubscriptionsByTopic",
      "sns:Publish"
    ]

    resources = [aws_sns_topic.bounces[0].arn]
  }
}

# Policy for complaint topic (only if we created it)
resource "aws_sns_topic_policy" "complaints" {
  count = var.enable_sns_notifications && var.complaint_topic_arn == "" ? 1 : 0

  arn    = aws_sns_topic.complaints[0].arn
  policy = data.aws_iam_policy_document.ses_sns_publish_complaints[0].json
}

data "aws_iam_policy_document" "ses_sns_publish_complaints" {
  count = var.enable_sns_notifications && var.complaint_topic_arn == "" ? 1 : 0

  # Allow SES to publish complaint notifications
  statement {
    sid    = "AllowSESPublish"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ses.amazonaws.com"]
    }

    actions = ["sns:Publish"]

    resources = [aws_sns_topic.complaints[0].arn]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_ses_domain_identity.main.arn]
    }
  }

  # Allow the account root to manage the topic
  statement {
    sid    = "AllowAccountManagement"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = [
      "sns:GetTopicAttributes",
      "sns:SetTopicAttributes",
      "sns:AddPermission",
      "sns:RemovePermission",
      "sns:DeleteTopic",
      "sns:Subscribe",
      "sns:ListSubscriptionsByTopic",
      "sns:Publish"
    ]

    resources = [aws_sns_topic.complaints[0].arn]
  }
}

# -----------------------------------------------------------------------------
# SES Identity Notification Configuration
# -----------------------------------------------------------------------------
# Configure the domain identity to send notifications to SNS topics

# Bounce notifications
resource "aws_ses_identity_notification_topic" "bounces" {
  count = var.enable_sns_notifications ? 1 : 0

  topic_arn                = var.bounce_topic_arn != "" ? var.bounce_topic_arn : aws_sns_topic.bounces[0].arn
  notification_type        = "Bounce"
  identity                 = aws_ses_domain_identity.main.domain
  include_original_headers = var.include_original_headers
}

# Complaint notifications
resource "aws_ses_identity_notification_topic" "complaints" {
  count = var.enable_sns_notifications ? 1 : 0

  topic_arn                = var.complaint_topic_arn != "" ? var.complaint_topic_arn : aws_sns_topic.complaints[0].arn
  notification_type        = "Complaint"
  identity                 = aws_ses_domain_identity.main.domain
  include_original_headers = var.include_original_headers
}

# Delivery notifications (optional - can be verbose)
resource "aws_ses_identity_notification_topic" "deliveries" {
  count = var.enable_sns_notifications && var.delivery_topic_arn != "" ? 1 : 0

  topic_arn                = var.delivery_topic_arn
  notification_type        = "Delivery"
  identity                 = aws_ses_domain_identity.main.domain
  include_original_headers = var.include_original_headers
}

# -----------------------------------------------------------------------------
# SNS Event Destination for Configuration Set
# -----------------------------------------------------------------------------
# This provides an alternative event stream via the configuration set

resource "aws_ses_event_destination" "sns_bounces" {
  count = var.enable_sns_notifications ? 1 : 0

  name                   = "${local.name_prefix}-sns-bounces"
  configuration_set_name = aws_ses_configuration_set.main.name
  enabled                = true

  matching_types = ["bounce"]

  sns_destination {
    topic_arn = var.bounce_topic_arn != "" ? var.bounce_topic_arn : aws_sns_topic.bounces[0].arn
  }
}

resource "aws_ses_event_destination" "sns_complaints" {
  count = var.enable_sns_notifications ? 1 : 0

  name                   = "${local.name_prefix}-sns-complaints"
  configuration_set_name = aws_ses_configuration_set.main.name
  enabled                = true

  matching_types = ["complaint"]

  sns_destination {
    topic_arn = var.complaint_topic_arn != "" ? var.complaint_topic_arn : aws_sns_topic.complaints[0].arn
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Log Group for SNS Processing
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "sns_notifications" {
  count = var.enable_sns_notifications ? 1 : 0

  name              = "/aws/ses/${local.name_prefix}/sns-notifications"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-sns-notifications-logs"
    Purpose = "ses-sns-logging"
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Alarms for Bounce/Complaint Rates
# -----------------------------------------------------------------------------

# Alarm for messages published to bounce topic
resource "aws_cloudwatch_metric_alarm" "bounce_topic_messages" {
  count = var.enable_sns_notifications && var.bounce_topic_arn == "" ? 1 : 0

  alarm_name          = "${local.name_prefix}-ses-bounce-volume"
  alarm_description   = "Alarm when bounce notifications exceed threshold (potential deliverability issue)"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "NumberOfMessagesPublished"
  namespace           = "AWS/SNS"
  period              = var.alarm_period_seconds
  statistic           = "Sum"
  threshold           = 50 # Alert if more than 50 bounces in the period
  treat_missing_data  = "notBreaching"

  dimensions = {
    TopicName = aws_sns_topic.bounces[0].name
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  ok_actions    = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-bounce-volume-alarm"
    Purpose = "monitoring"
  })
}

# Alarm for messages published to complaint topic
resource "aws_cloudwatch_metric_alarm" "complaint_topic_messages" {
  count = var.enable_sns_notifications && var.complaint_topic_arn == "" ? 1 : 0

  alarm_name          = "${local.name_prefix}-ses-complaint-volume"
  alarm_description   = "Alarm when complaint notifications received (potential spam reports)"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "NumberOfMessagesPublished"
  namespace           = "AWS/SNS"
  period              = 3600 # 1 hour
  statistic           = "Sum"
  threshold           = 5 # Alert if more than 5 complaints per hour (very sensitive)
  treat_missing_data  = "notBreaching"

  dimensions = {
    TopicName = aws_sns_topic.complaints[0].name
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  ok_actions    = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-complaint-volume-alarm"
    Purpose = "monitoring"
  })
}
