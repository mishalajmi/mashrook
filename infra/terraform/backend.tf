# =============================================================================
# Terraform Backend Configuration
# =============================================================================
# This file configures the remote state backend using S3 with DynamoDB locking.
#
# BOOTSTRAP REQUIREMENTS (Manual Steps Before First Apply):
# ---------------------------------------------------------
# The following resources must be created manually before running terraform init:
#
# 1. S3 Bucket for State Storage:
#    aws s3api create-bucket \
#      --bucket mashrook-terraform-state \
#      --region me-south-1 \
#      --create-bucket-configuration LocationConstraint=me-south-1
#
#    aws s3api put-bucket-versioning \
#      --bucket mashrook-terraform-state \
#      --versioning-configuration Status=Enabled
#
#    aws s3api put-bucket-encryption \
#      --bucket mashrook-terraform-state \
#      --server-side-encryption-configuration '{
#        "Rules": [{
#          "ApplyServerSideEncryptionByDefault": {
#            "SSEAlgorithm": "aws:kms"
#          },
#          "BucketKeyEnabled": true
#        }]
#      }'
#
#    aws s3api put-public-access-block \
#      --bucket mashrook-terraform-state \
#      --public-access-block-configuration '{
#        "BlockPublicAcls": true,
#        "IgnorePublicAcls": true,
#        "BlockPublicPolicy": true,
#        "RestrictPublicBuckets": true
#      }'
#
# 2. DynamoDB Table for State Locking:
#    aws dynamodb create-table \
#      --table-name mashrook-terraform-locks \
#      --attribute-definitions AttributeName=LockID,AttributeType=S \
#      --key-schema AttributeName=LockID,KeyType=HASH \
#      --billing-mode PAY_PER_REQUEST \
#      --region me-south-1
#
# =============================================================================

# Note: Backend configuration is intentionally left here as a template.
# Each environment (dev/prod) will have its own backend configuration
# with a unique state key to isolate state files.
#
# Example backend configuration (to be used in environment main.tf):
#
# terraform {
#   backend "s3" {
#     bucket         = "mashrook-terraform-state"
#     key            = "sns-notifications/<environment>/terraform.tfstate"
#     region         = "me-south-1"
#     dynamodb_table = "mashrook-terraform-locks"
#     encrypt        = true
#   }
# }
