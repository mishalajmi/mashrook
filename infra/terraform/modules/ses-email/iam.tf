# =============================================================================
# SES Email Module - IAM Configuration
# =============================================================================
# This file defines all IAM resources for the SES email module:
# - Sender Role: For cross-cloud access from GCP or EC2 instances
# - Sender User: For access key based authentication (SMTP/API)
# - SES Service Role: For SNS notification publishing
# =============================================================================

# -----------------------------------------------------------------------------
# SES Sender IAM Role
# -----------------------------------------------------------------------------
# This role can be assumed by:
# 1. GCP service accounts (cross-cloud via Web Identity Federation)
# 2. EC2 instances (via instance profile)
# 3. Other AWS services (Lambda, ECS, etc.)

resource "aws_iam_role" "ses_sender" {
  name        = "${var.project_name}-ses-sender-role-${var.environment}"
  description = "IAM role for sending emails via Mashrook SES"

  assume_role_policy = data.aws_iam_policy_document.ses_sender_trust.json

  # Force detach policies on role deletion
  force_detach_policies = true

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-ses-sender-role-${var.environment}"
    Purpose = "ses-sending"
  })
}

# Trust policy for the sender role
data "aws_iam_policy_document" "ses_sender_trust" {
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

  # Allow EC2 instances to assume this role
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

# Policy granting SES send permissions
resource "aws_iam_role_policy" "ses_sender" {
  name   = "${var.project_name}-ses-send-policy-${var.environment}"
  role   = aws_iam_role.ses_sender.id
  policy = data.aws_iam_policy_document.ses_send.json
}

# Least-privilege policy document for SES sending
data "aws_iam_policy_document" "ses_send" {
  # Allow sending emails from the verified domain
  statement {
    sid    = "AllowSESSendEmail"
    effect = "Allow"

    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
      "ses:SendTemplatedEmail",
      "ses:SendBulkTemplatedEmail"
    ]

    resources = [
      # Allow sending from the verified domain identity
      aws_ses_domain_identity.main.arn,
      # Allow sending from any email address in the domain
      "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:identity/*@${var.domain_name}"
    ]

    # Require the use of our configuration set for tracking
    condition {
      test     = "StringEquals"
      variable = "ses:ConfigurationSetName"
      values   = [aws_ses_configuration_set.main.name]
    }
  }

  # Allow sending with any configuration set (more permissive, optional)
  statement {
    sid    = "AllowSESSendWithAnyConfigSet"
    effect = "Allow"

    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail"
    ]

    resources = [
      aws_ses_domain_identity.main.arn
    ]
  }

  # Allow checking sending quota and statistics
  statement {
    sid    = "AllowSESGetSendQuota"
    effect = "Allow"

    actions = [
      "ses:GetSendQuota",
      "ses:GetSendStatistics"
    ]

    resources = ["*"]
  }

  # Allow managing email templates
  statement {
    sid    = "AllowSESTemplateManagement"
    effect = "Allow"

    actions = [
      "ses:CreateTemplate",
      "ses:UpdateTemplate",
      "ses:DeleteTemplate",
      "ses:GetTemplate",
      "ses:ListTemplates",
      "ses:TestRenderTemplate"
    ]

    resources = ["*"]
  }

  # Allow checking verification status
  statement {
    sid    = "AllowSESVerificationCheck"
    effect = "Allow"

    actions = [
      "ses:GetIdentityVerificationAttributes",
      "ses:GetIdentityDkimAttributes",
      "ses:GetIdentityMailFromDomainAttributes"
    ]

    resources = [
      aws_ses_domain_identity.main.arn
    ]
  }
}

# -----------------------------------------------------------------------------
# SES Sender IAM User (Alternative to Role-based Access)
# -----------------------------------------------------------------------------
# This user provides access key based authentication for:
# 1. SMTP-based email sending (Spring Boot mail sender)
# 2. API-based email sending (AWS SDK)

resource "aws_iam_user" "ses_sender" {
  count = var.enable_iam_user ? 1 : 0

  name = "${var.project_name}-ses-sender-${var.environment}"
  path = "/service-accounts/"

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-ses-sender-${var.environment}"
    Purpose = "ses-sending"
  })
}

# Attach the same send policy to the IAM user
resource "aws_iam_user_policy" "ses_sender" {
  count = var.enable_iam_user ? 1 : 0

  name   = "${var.project_name}-ses-send-policy"
  user   = aws_iam_user.ses_sender[0].name
  policy = data.aws_iam_policy_document.ses_send.json
}

# Create access keys for the IAM user
resource "aws_iam_access_key" "ses_sender" {
  count = var.enable_iam_user ? 1 : 0

  user = aws_iam_user.ses_sender[0].name
}

# -----------------------------------------------------------------------------
# IAM Instance Profile (for EC2-based deployments)
# -----------------------------------------------------------------------------

resource "aws_iam_instance_profile" "ses_sender" {
  name = "${var.project_name}-ses-sender-profile-${var.environment}"
  role = aws_iam_role.ses_sender.name

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-ses-sender-profile-${var.environment}"
    Purpose = "ec2-instance-profile"
  })
}

# -----------------------------------------------------------------------------
# SES Service Role for SNS Publishing
# -----------------------------------------------------------------------------
# This allows SES to publish bounce/complaint notifications to SNS

data "aws_iam_policy_document" "ses_sns_publish_trust" {
  statement {
    sid     = "AllowSESAssume"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ses.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}
