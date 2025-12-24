# ============================================================================
# Terraform Outputs
# ============================================================================

output "api_gateway_url" {
  description = "The URL of the API Gateway"
  value       = "${aws_api_gateway_stage.main.invoke_url}"
}

output "api_gateway_id" {
  description = "The ID of the API Gateway"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_stage" {
  description = "The stage name of the API Gateway"
  value       = aws_api_gateway_stage.main.stage_name
}

output "lambda_function_name" {
  description = "The name of the Lambda function"
  value       = aws_lambda_function.api.function_name
}

output "lambda_function_arn" {
  description = "The ARN of the Lambda function"
  value       = aws_lambda_function.api.arn
}

output "api_endpoints" {
  description = "Available API endpoints"
  value = {
    health     = "${aws_api_gateway_stage.main.invoke_url}/health"
    users      = "${aws_api_gateway_stage.main.invoke_url}/users"
    analytics  = "${aws_api_gateway_stage.main.invoke_url}/analytics"
    features   = "${aws_api_gateway_stage.main.invoke_url}/features"
    products   = "${aws_api_gateway_stage.main.invoke_url}/products"
    binary     = "${aws_api_gateway_stage.main.invoke_url}/binary"
  }
}

output "binary_endpoints" {
  description = "Binary content test endpoints"
  value = {
    png            = "${aws_api_gateway_stage.main.invoke_url}/binary/image/png"
    jpeg           = "${aws_api_gateway_stage.main.invoke_url}/binary/image/jpeg"
    pdf            = "${aws_api_gateway_stage.main.invoke_url}/binary/pdf"
    zip            = "${aws_api_gateway_stage.main.invoke_url}/binary/zip"
    octet_stream   = "${aws_api_gateway_stage.main.invoke_url}/binary/octet-stream"
    video          = "${aws_api_gateway_stage.main.invoke_url}/binary/video"
    audio          = "${aws_api_gateway_stage.main.invoke_url}/binary/audio"
  }
}

output "environment" {
  description = "The deployment environment"
  value       = var.environment
}

output "region" {
  description = "The AWS region"
  value       = local.region
}
