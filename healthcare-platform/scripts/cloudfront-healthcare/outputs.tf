output "healthcare_bucket" {
  value = aws_s3_bucket.healthcare.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.this.id
}
