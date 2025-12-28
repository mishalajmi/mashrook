# =============================================================================
# SNS Notifications Module - Outputs
# =============================================================================
# This file defines all outputs from the SNS notifications module.
# Outputs are grouped by resource type and include descriptions.
# Sensitive outputs are marked accordingly.
# =============================================================================

# -----------------------------------------------------------------------------
# SNS Topic Outputs
# -----------------------------------------------------------------------------

output "payment_reminders_topic_arn" {
  description = "ARN of the payment reminders SNS topic"
  value       = aws_sns_topic.payment_reminders.arn
}

output "payment_reminders_topic_name" {
  description = "Name of the payment reminders SNS topic"
  value       = aws_sns_topic.payment_reminders.name
}

output "campaign_updates_topic_arn" {
  description = "ARN of the campaign updates SNS topic"
  value       = aws_sns_topic.campaign_updates.arn
}

output "campaign_updates_topic_name" {
  description = "Name of the campaign updates SNS topic"
  value       = aws_sns_topic.campaign_updates.name
}

# -----------------------------------------------------------------------------
# IAM Role Outputs
# -----------------------------------------------------------------------------

output "publisher_role_arn" {
  description = "ARN of the SNS publisher IAM role"
  value       = aws_iam_role.sns_publisher.arn
}

output "publisher_role_name" {
  description = "Name of the SNS publisher IAM role"
  value       = aws_iam_role.sns_publisher.name
}

output "publisher_instance_profile_arn" {
  description = "ARN of the SNS publisher instance profile (for EC2)"
  value       = aws_iam_instance_profile.sns_publisher.arn
}

output "publisher_instance_profile_name" {
  description = "Name of the SNS publisher instance profile (for EC2)"
  value       = aws_iam_instance_profile.sns_publisher.name
}

output "delivery_status_role_arn" {
  description = "ARN of the SNS delivery status IAM role (for CloudWatch logging)"
  value       = aws_iam_role.sns_delivery_status.arn
}

# -----------------------------------------------------------------------------
# IAM User Outputs (Sensitive)
# -----------------------------------------------------------------------------

output "publisher_user_arn" {
  description = "ARN of the SNS publisher IAM user (if enabled)"
  value       = var.enable_iam_user ? aws_iam_user.sns_publisher[0].arn : null
}

output "publisher_user_name" {
  description = "Name of the SNS publisher IAM user (if enabled)"
  value       = var.enable_iam_user ? aws_iam_user.sns_publisher[0].name : null
}

output "publisher_access_key_id" {
  description = "Access key ID for the SNS publisher IAM user (if enabled)"
  value       = var.enable_iam_user ? aws_iam_access_key.sns_publisher[0].id : null
  sensitive   = true
}

output "publisher_secret_access_key" {
  description = "Secret access key for the SNS publisher IAM user (if enabled)"
  value       = var.enable_iam_user ? aws_iam_access_key.sns_publisher[0].secret : null
  sensitive   = true
}

# -----------------------------------------------------------------------------
# CloudWatch Outputs
# -----------------------------------------------------------------------------

output "sms_delivery_log_group_name" {
  description = "Name of the CloudWatch log group for SMS delivery status"
  value       = aws_cloudwatch_log_group.sns_sms_delivery.name
}

output "sms_delivery_log_group_arn" {
  description = "ARN of the CloudWatch log group for SMS delivery status"
  value       = aws_cloudwatch_log_group.sns_sms_delivery.arn
}

output "direct_publish_log_group_name" {
  description = "Name of the CloudWatch log group for direct SMS publish"
  value       = aws_cloudwatch_log_group.sns_direct_publish.name
}

output "sms_delivery_failures_alarm_arn" {
  description = "ARN of the CloudWatch alarm for SMS delivery failures"
  value       = aws_cloudwatch_metric_alarm.sms_delivery_failures.arn
}

output "sms_spend_warning_alarm_arn" {
  description = "ARN of the CloudWatch alarm for SMS spend warning"
  value       = aws_cloudwatch_metric_alarm.sms_spend_warning.arn
}

# -----------------------------------------------------------------------------
# Configuration Outputs (for reference by other modules)
# -----------------------------------------------------------------------------

output "configuration" {
  description = "Configuration summary for reference by other modules or documentation"
  value = {
    environment         = var.environment
    project_name        = var.project_name
    region              = data.aws_region.current.name
    account_id          = data.aws_caller_identity.current.account_id
    monthly_spend_limit = var.monthly_spend_limit
    sms_type            = var.default_sms_type
    sender_id           = var.default_sender_id
  }
}
