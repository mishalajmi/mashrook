# =============================================================================
# Production Environment - Outputs
# =============================================================================
# This file exposes outputs from the SNS notifications and SES email modules
# for the production environment. These values can be used by other Terraform
# configurations or retrieved via terraform output commands.
# =============================================================================

# -----------------------------------------------------------------------------
# SNS Topic Outputs
# -----------------------------------------------------------------------------

output "payment_reminders_topic_arn" {
  description = "ARN of the payment reminders SNS topic"
  value       = module.sns_notifications.payment_reminders_topic_arn
}

output "payment_reminders_topic_name" {
  description = "Name of the payment reminders SNS topic"
  value       = module.sns_notifications.payment_reminders_topic_name
}

output "campaign_updates_topic_arn" {
  description = "ARN of the campaign updates SNS topic"
  value       = module.sns_notifications.campaign_updates_topic_arn
}

output "campaign_updates_topic_name" {
  description = "Name of the campaign updates SNS topic"
  value       = module.sns_notifications.campaign_updates_topic_name
}

# -----------------------------------------------------------------------------
# IAM Role Outputs
# -----------------------------------------------------------------------------

output "publisher_role_arn" {
  description = "ARN of the SNS publisher IAM role"
  value       = module.sns_notifications.publisher_role_arn
}

output "publisher_role_name" {
  description = "Name of the SNS publisher IAM role"
  value       = module.sns_notifications.publisher_role_name
}

output "publisher_instance_profile_arn" {
  description = "ARN of the SNS publisher instance profile"
  value       = module.sns_notifications.publisher_instance_profile_arn
}

output "delivery_status_role_arn" {
  description = "ARN of the delivery status logging role"
  value       = module.sns_notifications.delivery_status_role_arn
}

# -----------------------------------------------------------------------------
# IAM User Outputs (Sensitive)
# -----------------------------------------------------------------------------

output "publisher_user_arn" {
  description = "ARN of the SNS publisher IAM user"
  value       = module.sns_notifications.publisher_user_arn
}

output "publisher_access_key_id" {
  description = "Access key ID for the SNS publisher IAM user"
  value       = module.sns_notifications.publisher_access_key_id
  sensitive   = true
}

output "publisher_secret_access_key" {
  description = "Secret access key for the SNS publisher IAM user"
  value       = module.sns_notifications.publisher_secret_access_key
  sensitive   = true
}

# -----------------------------------------------------------------------------
# CloudWatch Outputs
# -----------------------------------------------------------------------------

output "sms_delivery_log_group_name" {
  description = "Name of the SMS delivery log group"
  value       = module.sns_notifications.sms_delivery_log_group_name
}

output "sms_delivery_failures_alarm_arn" {
  description = "ARN of the SMS delivery failures alarm"
  value       = module.sns_notifications.sms_delivery_failures_alarm_arn
}

output "sms_spend_warning_alarm_arn" {
  description = "ARN of the SMS spend warning alarm"
  value       = module.sns_notifications.sms_spend_warning_alarm_arn
}

# -----------------------------------------------------------------------------
# Configuration Summary
# -----------------------------------------------------------------------------

output "sns_configuration" {
  description = "SNS configuration summary for this environment"
  value       = module.sns_notifications.configuration
}

# =============================================================================
# SES Email Module Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# Domain Identity Outputs
# -----------------------------------------------------------------------------

output "ses_domain_identity_arn" {
  description = "ARN of the SES domain identity"
  value       = module.ses_email.domain_identity_arn
}

output "ses_domain_verification_token" {
  description = "Domain verification token for DNS TXT record"
  value       = module.ses_email.domain_identity_verification_token
}

output "ses_dkim_tokens" {
  description = "DKIM tokens for DNS CNAME records"
  value       = module.ses_email.dkim_tokens
}

# -----------------------------------------------------------------------------
# Configuration Set Outputs
# -----------------------------------------------------------------------------

output "ses_configuration_set_name" {
  description = "Name of the SES configuration set"
  value       = module.ses_email.configuration_set_name
}

# -----------------------------------------------------------------------------
# SMTP Credentials (Sensitive)
# -----------------------------------------------------------------------------

output "ses_smtp_endpoint" {
  description = "SES SMTP endpoint"
  value       = module.ses_email.smtp_endpoint
}

output "ses_smtp_username" {
  description = "SMTP username for SES"
  value       = module.ses_email.smtp_username
  sensitive   = true
}

output "ses_smtp_password" {
  description = "SMTP password for SES"
  value       = module.ses_email.smtp_password
  sensitive   = true
}

# -----------------------------------------------------------------------------
# IAM Credentials (Sensitive)
# -----------------------------------------------------------------------------

output "ses_sender_access_key_id" {
  description = "Access key ID for SES sender IAM user"
  value       = module.ses_email.sender_access_key_id
  sensitive   = true
}

output "ses_sender_secret_access_key" {
  description = "Secret access key for SES sender IAM user"
  value       = module.ses_email.sender_secret_access_key
  sensitive   = true
}

# -----------------------------------------------------------------------------
# SNS Topics for Bounce/Complaint Handling
# -----------------------------------------------------------------------------

output "ses_bounce_topic_arn" {
  description = "ARN of the SNS topic for bounce notifications"
  value       = module.ses_email.bounce_topic_arn
}

output "ses_complaint_topic_arn" {
  description = "ARN of the SNS topic for complaint notifications"
  value       = module.ses_email.complaint_topic_arn
}

# -----------------------------------------------------------------------------
# DNS Records Required
# -----------------------------------------------------------------------------

output "ses_required_dns_records" {
  description = "All DNS records required for SES verification and authentication"
  value       = module.ses_email.required_dns_records
}

# -----------------------------------------------------------------------------
# Spring Boot Integration
# -----------------------------------------------------------------------------

output "ses_spring_boot_config" {
  description = "Configuration values for Spring Boot application"
  value       = module.ses_email.spring_boot_config
  sensitive   = true
}

# -----------------------------------------------------------------------------
# SES Configuration Summary
# -----------------------------------------------------------------------------

output "ses_configuration" {
  description = "SES configuration summary for this environment"
  value       = module.ses_email.configuration
}
