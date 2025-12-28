# =============================================================================
# SES Email Module - Outputs
# =============================================================================
# This file defines all outputs from the SES email module.
# Outputs are grouped by resource type and include descriptions.
# Sensitive outputs are marked accordingly.
# =============================================================================

# -----------------------------------------------------------------------------
# Domain Identity Outputs
# -----------------------------------------------------------------------------

output "domain_identity_arn" {
  description = "ARN of the SES domain identity"
  value       = aws_ses_domain_identity.main.arn
}

output "domain_identity_verification_token" {
  description = "Verification token for the SES domain identity. Add this as a TXT record to your DNS."
  value       = aws_ses_domain_identity.main.verification_token
}

output "domain_verification_status" {
  description = "Verification status of the domain identity (Pending, Success, Failed, TemporaryFailure, NotStarted)"
  value       = var.enable_domain_verification ? "Verification Attempted" : "Verification Not Enabled"
}

# -----------------------------------------------------------------------------
# DKIM Outputs
# -----------------------------------------------------------------------------

output "dkim_tokens" {
  description = "DKIM tokens for DNS CNAME records. Create CNAME records for each token."
  value       = aws_ses_domain_dkim.main.dkim_tokens
}

output "dkim_verification_status" {
  description = "Instruction for DKIM DNS records"
  value       = "Create CNAME records: {token}._domainkey.${var.domain_name} -> {token}.dkim.amazonses.com"
}

# -----------------------------------------------------------------------------
# Mail From Domain Outputs
# -----------------------------------------------------------------------------

output "mail_from_domain" {
  description = "Custom MAIL FROM domain (if enabled)"
  value       = var.enable_custom_mail_from ? "mail.${var.domain_name}" : null
}

output "mail_from_mx_record" {
  description = "MX record value for custom MAIL FROM domain"
  value       = var.enable_custom_mail_from ? "10 feedback-smtp.${var.aws_region}.amazonses.com" : null
}

output "mail_from_spf_record" {
  description = "SPF TXT record for custom MAIL FROM domain"
  value       = var.enable_custom_mail_from ? "v=spf1 include:amazonses.com ~all" : null
}

# -----------------------------------------------------------------------------
# Configuration Set Outputs
# -----------------------------------------------------------------------------

output "configuration_set_name" {
  description = "Name of the SES configuration set"
  value       = aws_ses_configuration_set.main.name
}

output "configuration_set_arn" {
  description = "ARN of the SES configuration set"
  value       = aws_ses_configuration_set.main.arn
}

# -----------------------------------------------------------------------------
# Email Identity Outputs
# -----------------------------------------------------------------------------

output "email_identities" {
  description = "List of verified email identities"
  value       = [for email in aws_ses_email_identity.senders : email.email]
}

# -----------------------------------------------------------------------------
# IAM Role Outputs
# -----------------------------------------------------------------------------

output "sender_role_arn" {
  description = "ARN of the SES sender IAM role"
  value       = aws_iam_role.ses_sender.arn
}

output "sender_role_name" {
  description = "Name of the SES sender IAM role"
  value       = aws_iam_role.ses_sender.name
}

# -----------------------------------------------------------------------------
# IAM User Outputs (Sensitive)
# -----------------------------------------------------------------------------

output "sender_user_arn" {
  description = "ARN of the SES sender IAM user (if enabled)"
  value       = var.enable_iam_user ? aws_iam_user.ses_sender[0].arn : null
}

output "sender_user_name" {
  description = "Name of the SES sender IAM user (if enabled)"
  value       = var.enable_iam_user ? aws_iam_user.ses_sender[0].name : null
}

output "sender_access_key_id" {
  description = "Access key ID for the SES sender IAM user (if enabled)"
  value       = var.enable_iam_user ? aws_iam_access_key.ses_sender[0].id : null
  sensitive   = true
}

output "sender_secret_access_key" {
  description = "Secret access key for the SES sender IAM user (if enabled)"
  value       = var.enable_iam_user ? aws_iam_access_key.ses_sender[0].secret : null
  sensitive   = true
}

# -----------------------------------------------------------------------------
# SMTP Credentials (Sensitive)
# -----------------------------------------------------------------------------

output "smtp_endpoint" {
  description = "SES SMTP endpoint for the configured region"
  value       = "email-smtp.${var.aws_region}.amazonaws.com"
}

output "smtp_port" {
  description = "Recommended SMTP ports for SES (TLS: 587, SSL: 465)"
  value = {
    tls_starttls = 587
    tls_wrapper  = 465
    legacy       = 25
  }
}

output "smtp_username" {
  description = "SMTP username (same as access key ID)"
  value       = var.enable_iam_user && var.enable_smtp_credentials ? aws_iam_access_key.ses_sender[0].id : null
  sensitive   = true
}

output "smtp_password" {
  description = "SMTP password (derived from secret access key using SES SMTP algorithm)"
  value       = var.enable_iam_user && var.enable_smtp_credentials ? aws_iam_access_key.ses_sender[0].ses_smtp_password_v4 : null
  sensitive   = true
}

# -----------------------------------------------------------------------------
# SNS Topic Outputs
# -----------------------------------------------------------------------------

output "bounce_topic_arn" {
  description = "ARN of the SNS topic for bounce notifications"
  value       = var.enable_sns_notifications ? (var.bounce_topic_arn != "" ? var.bounce_topic_arn : aws_sns_topic.bounces[0].arn) : null
}

output "complaint_topic_arn" {
  description = "ARN of the SNS topic for complaint notifications"
  value       = var.enable_sns_notifications ? (var.complaint_topic_arn != "" ? var.complaint_topic_arn : aws_sns_topic.complaints[0].arn) : null
}

output "delivery_topic_arn" {
  description = "ARN of the SNS topic for delivery notifications"
  value       = var.enable_sns_notifications && var.delivery_topic_arn != "" ? var.delivery_topic_arn : null
}

# -----------------------------------------------------------------------------
# CloudWatch Outputs
# -----------------------------------------------------------------------------

output "ses_events_log_group_name" {
  description = "Name of the CloudWatch log group for SES events"
  value       = aws_cloudwatch_log_group.ses_events.name
}

output "ses_events_log_group_arn" {
  description = "ARN of the CloudWatch log group for SES events"
  value       = aws_cloudwatch_log_group.ses_events.arn
}

output "bounce_rate_alarm_arn" {
  description = "ARN of the CloudWatch alarm for bounce rate"
  value       = aws_cloudwatch_metric_alarm.bounce_rate.arn
}

output "complaint_rate_alarm_arn" {
  description = "ARN of the CloudWatch alarm for complaint rate"
  value       = aws_cloudwatch_metric_alarm.complaint_rate.arn
}

# -----------------------------------------------------------------------------
# DNS Records Summary
# -----------------------------------------------------------------------------

output "required_dns_records" {
  description = "Summary of all DNS records required for SES configuration"
  value = {
    # Domain verification TXT record
    domain_verification = {
      type  = "TXT"
      name  = "_amazonses.${var.domain_name}"
      value = aws_ses_domain_identity.main.verification_token
    }

    # DKIM CNAME records
    dkim_records = [
      for token in aws_ses_domain_dkim.main.dkim_tokens : {
        type  = "CNAME"
        name  = "${token}._domainkey.${var.domain_name}"
        value = "${token}.dkim.amazonses.com"
      }
    ]

    # Mail FROM MX record (if enabled)
    mail_from_mx = var.enable_custom_mail_from ? {
      type     = "MX"
      name     = "mail.${var.domain_name}"
      value    = "10 feedback-smtp.${var.aws_region}.amazonses.com"
      priority = 10
    } : null

    # Mail FROM SPF record (if enabled)
    mail_from_spf = var.enable_custom_mail_from ? {
      type  = "TXT"
      name  = "mail.${var.domain_name}"
      value = "v=spf1 include:amazonses.com ~all"
    } : null

    # SPF record for main domain
    domain_spf = {
      type  = "TXT"
      name  = var.domain_name
      value = "v=spf1 include:amazonses.com ~all"
    }

    # DMARC record recommendation
    dmarc = {
      type  = "TXT"
      name  = "_dmarc.${var.domain_name}"
      value = "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${var.domain_name}"
    }
  }
}

# -----------------------------------------------------------------------------
# Configuration Summary
# -----------------------------------------------------------------------------

output "configuration" {
  description = "Configuration summary for reference by other modules or documentation"
  value = {
    environment           = var.environment
    project_name          = var.project_name
    region                = data.aws_region.current.name
    account_id            = data.aws_caller_identity.current.account_id
    domain                = var.domain_name
    configuration_set     = aws_ses_configuration_set.main.name
    tls_policy            = var.tls_policy
    reputation_metrics    = var.enable_reputation_metrics
    sns_notifications     = var.enable_sns_notifications
    bounce_threshold      = var.bounce_rate_threshold
    complaint_threshold   = var.complaint_rate_threshold
    daily_sending_quota   = var.daily_sending_quota
  }
}

# -----------------------------------------------------------------------------
# Integration Outputs (for Spring Boot / Java application)
# -----------------------------------------------------------------------------

output "spring_boot_config" {
  description = "Configuration values for Spring Boot application.yml"
  sensitive   = true
  value = {
    aws_ses_region                = var.aws_region
    aws_ses_configuration_set     = aws_ses_configuration_set.main.name
    aws_ses_from_domain           = var.domain_name
    aws_ses_access_key_id         = var.enable_iam_user ? aws_iam_access_key.ses_sender[0].id : null
    aws_ses_secret_access_key     = var.enable_iam_user ? aws_iam_access_key.ses_sender[0].secret : null
    smtp_host                     = "email-smtp.${var.aws_region}.amazonaws.com"
    smtp_port                     = 587
    smtp_username                 = var.enable_iam_user && var.enable_smtp_credentials ? aws_iam_access_key.ses_sender[0].id : null
    smtp_password                 = var.enable_iam_user && var.enable_smtp_credentials ? aws_iam_access_key.ses_sender[0].ses_smtp_password_v4 : null
  }
}
