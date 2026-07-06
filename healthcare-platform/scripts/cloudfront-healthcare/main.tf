terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# ---------------- S3 (PRIVATE) ----------------
resource "aws_s3_bucket" "healthcare" {
  bucket = var.healthcare_bucket_name
}

resource "aws_s3_bucket_public_access_block" "healthcare" {
  bucket = aws_s3_bucket.healthcare.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---------------- OAC ----------------
resource "aws_cloudfront_origin_access_control" "healthcare" {
  name                              = "healthcare-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ---------------- Cache Policy ----------------
data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

# ---------------- CloudFront ----------------
resource "aws_cloudfront_distribution" "this" {
  enabled = true

  origin {
    origin_id                = "healthcare-s3"
    domain_name              = aws_s3_bucket.healthcare.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.healthcare.id
  }

  ordered_cache_behavior {
    path_pattern     = "/healthcare/*"
    target_origin_id = "healthcare-s3"

    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    compress        = true
    cache_policy_id = data.aws_cloudfront_cache_policy.optimized.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# ---------------- Bucket Policy ----------------
data "aws_iam_policy_document" "healthcare_bucket_policy" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["\${aws_s3_bucket.healthcare.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.this.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "healthcare" {
  bucket = aws_s3_bucket.healthcare.id
  policy = data.aws_iam_policy_document.healthcare_bucket_policy.json
}
