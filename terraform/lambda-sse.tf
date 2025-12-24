# ============================================================================
# SSE Streaming Lambda Function with Function URL
# ============================================================================

# Package the SSE Lambda code separately
data "archive_file" "sse_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambdas/src/handlers/sse.js"
  output_path = "${path.module}/lambdas/sse-lambda.zip"
}

# SSE Lambda function with response streaming
resource "aws_lambda_function" "sse" {
  filename         = data.archive_file.sse_lambda_zip.output_path
  function_name    = "${local.name_prefix}-sse"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "sse.handler"
  source_code_hash = data.archive_file.sse_lambda_zip.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 120  # 2 minutes for streaming
  memory_size      = 256

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = local.common_tags
}

# Lambda Function URL for SSE (enables response streaming)
resource "aws_lambda_function_url" "sse" {
  function_name      = aws_lambda_function.sse.function_name
  authorization_type = "NONE"  # Public access (can add IAM auth if needed)

  cors {
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST"]
    allow_headers     = ["Content-Type", "X-Trace-ID"]
    expose_headers    = ["Content-Type"]
    max_age           = 3600
  }

  invoke_mode = "RESPONSE_STREAM"  # Enable response streaming
}

# Allow public access to Function URL
# Note: Lambda Function URLs with NONE auth don't require explicit permissions
# The authorization_type = "NONE" in aws_lambda_function_url handles public access

# CloudWatch Log Group for SSE Lambda
resource "aws_cloudwatch_log_group" "sse_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.sse.function_name}"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = local.common_tags
}

# Output the Function URL
output "sse_function_url" {
  description = "Lambda Function URL for SSE streaming"
  value       = aws_lambda_function_url.sse.function_url
}
