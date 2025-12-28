# =============================================================================
# SNS Notifications Module - IAM Configuration
# =============================================================================
# This file defines all IAM resources for the SNS notifications module:
# - Publisher Role: For cross-cloud access from GCP or EC2 instances
# - Publisher User: For simpler access key based authentication
# - Delivery Status Role: For CloudWatch logging of SMS delivery status
# =============================================================================

# -----------------------------------------------------------------------------
# SNS Publisher IAM Role
# -----------------------------------------------------------------------------
# This role can be assumed by:
# 1. GCP service accounts (cross-cloud via Web Identity Federation)
# 2. EC2 instances (via instance profile)
# 3. Other AWS services (Lambda, ECS, etc.)

resource "aws_iam_role" "sns_publisher" {
  name        = "${var.project_name}-sns-publisher-role-${var.environment}"
  description = "IAM role for publishing messages to Mashrook SNS topics"

  assume_role_policy = data.aws_iam_policy_document.sns_publisher_trust.json

  # Force detach policies on role deletion
  force_detach_policies = true

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-sns-publisher-role-${var.environment}"
    Purpose = "sns-publishing"
  })
}

# Trust policy for the publisher role
data "aws_iam_policy_document" "sns_publisher_trust" {
  # Allow GCP service account to assume this role via Web Identity Federation
  dynamic "statement" {
    for_each = var.gcp_service_account_id != "" && var.gcp_project_id != "" ? [1] : []
    content {
      sid     = "AllowGCPServiceAccountAssume"
      effect  = "Allow"
      actions = ["sts:AssumeRoleWithWebIdentity"]

      principals {
        type        = "Federated"
        identifiers = ["accounts.google.com"]
      }

      condition {
        test     = "StringEquals"
        variable = "accounts.google.com:sub"
        values   = [var.gcp_service_account_id]
      }
    }
  }

  # Allow EC2 instances to assume this role (for testing or EC2-based deployments)
  statement {
    sid     = "AllowEC2Assume"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }

  # Allow Lambda functions to assume this role
  statement {
    sid     = "AllowLambdaAssume"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }

  # Allow ECS tasks to assume this role
  statement {
    sid     = "AllowECSAssume"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Policy granting publish permissions to SNS topics
resource "aws_iam_role_policy" "sns_publisher" {
  name   = "${var.project_name}-sns-publish-policy-${var.environment}"
  role   = aws_iam_role.sns_publisher.id
  policy = data.aws_iam_policy_document.sns_publish.json
}

# Least-privilege policy document for SNS publishing
data "aws_iam_policy_document" "sns_publish" {
  # Allow publishing to specific SNS topics only
  statement {
    sid    = "AllowSNSPublish"
    effect = "Allow"

    actions = [
      "sns:Publish"
    ]

    resources = [
      aws_sns_topic.payment_reminders.arn,
      aws_sns_topic.campaign_updates.arn
    ]
  }

  # Allow direct SMS publishing (phone numbers as targets)
  statement {
    sid    = "AllowDirectSMSPublish"
    effect = "Allow"

    actions = [
      "sns:Publish"
    ]

    # For direct SMS, the resource is * but we can add conditions
    resources = ["*"]

    # Condition to ensure this is only for SMS
    condition {
      test     = "StringEquals"
      variable = "sns:Protocol"
      values   = ["sms"]
    }
  }

  # Allow checking SMS attributes (for phone number opt-out status)
  statement {
    sid    = "AllowSMSAttributeCheck"
    effect = "Allow"

    actions = [
      "sns:CheckIfPhoneNumberIsOptedOut",
      "sns:GetSMSAttributes"
    ]

    resources = ["*"]
  }
}

# -----------------------------------------------------------------------------
# SNS Publisher IAM User (Alternative to Role-based Access)
# -----------------------------------------------------------------------------
# This user provides access key based authentication for simpler setups
# where role assumption is not feasible (e.g., legacy applications)

resource "aws_iam_user" "sns_publisher" {
  count = var.enable_iam_user ? 1 : 0

  name = "${var.project_name}-sns-publisher-${var.environment}"
  path = "/service-accounts/"

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-sns-publisher-${var.environment}"
    Purpose = "sns-publishing"
  })
}

# Attach the same publish policy to the IAM user
resource "aws_iam_user_policy" "sns_publisher" {
  count = var.enable_iam_user ? 1 : 0

  name   = "${var.project_name}-sns-publish-policy"
  user   = aws_iam_user.sns_publisher[0].name
  policy = data.aws_iam_policy_document.sns_publish.json
}

# Create access keys for the IAM user
resource "aws_iam_access_key" "sns_publisher" {
  count = var.enable_iam_user ? 1 : 0

  user = aws_iam_user.sns_publisher[0].name
}

# -----------------------------------------------------------------------------
# SNS Delivery Status IAM Role
# -----------------------------------------------------------------------------
# This role allows SNS to write delivery status logs to CloudWatch

resource "aws_iam_role" "sns_delivery_status" {
  name        = "${var.project_name}-sns-delivery-status-${var.environment}"
  description = "IAM role for SNS to write SMS delivery status to CloudWatch Logs"

  assume_role_policy = data.aws_iam_policy_document.sns_delivery_status_trust.json

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-sns-delivery-status-${var.environment}"
    Purpose = "sns-delivery-logging"
  })
}

# Trust policy allowing SNS to assume the delivery status role
data "aws_iam_policy_document" "sns_delivery_status_trust" {
  statement {
    sid     = "AllowSNSAssume"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }
  }
}

# Policy granting CloudWatch Logs write permissions
resource "aws_iam_role_policy" "sns_delivery_status" {
  name   = "${var.project_name}-sns-cloudwatch-logs-${var.environment}"
  role   = aws_iam_role.sns_delivery_status.id
  policy = data.aws_iam_policy_document.sns_delivery_status_permissions.json
}

# CloudWatch Logs permissions for delivery status logging
data "aws_iam_policy_document" "sns_delivery_status_permissions" {
  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]

    resources = [
      "${aws_cloudwatch_log_group.sns_sms_delivery.arn}:*",
      "${aws_cloudwatch_log_group.sns_direct_publish.arn}:*"
    ]
  }
}

# -----------------------------------------------------------------------------
# IAM Instance Profile (for EC2-based deployments)
# -----------------------------------------------------------------------------

resource "aws_iam_instance_profile" "sns_publisher" {
  name = "${var.project_name}-sns-publisher-profile-${var.environment}"
  role = aws_iam_role.sns_publisher.name

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-sns-publisher-profile-${var.environment}"
    Purpose = "ec2-instance-profile"
  })
}
