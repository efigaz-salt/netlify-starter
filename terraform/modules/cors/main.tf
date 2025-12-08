# ============================================================================
# CORS Module for API Gateway Resources
# ============================================================================

variable "rest_api_id" {
  description = "The ID of the REST API"
  type        = string
}

variable "resource_id" {
  description = "The ID of the API Gateway resource"
  type        = string
}

variable "allowed_origins" {
  description = "Allowed origins for CORS"
  type        = string
  default     = "*"
}

variable "allowed_methods" {
  description = "Allowed HTTP methods"
  type        = string
  default     = "GET,POST,PUT,DELETE,OPTIONS,PATCH"
}

variable "allowed_headers" {
  description = "Allowed headers"
  type        = string
  default     = "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Trace-ID"
}

# OPTIONS method for CORS preflight
resource "aws_api_gateway_method" "options" {
  rest_api_id   = var.rest_api_id
  resource_id   = var.resource_id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Mock integration for OPTIONS
resource "aws_api_gateway_integration" "options" {
  rest_api_id = var.rest_api_id
  resource_id = var.resource_id
  http_method = aws_api_gateway_method.options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# Method response for OPTIONS
resource "aws_api_gateway_method_response" "options" {
  rest_api_id = var.rest_api_id
  resource_id = var.resource_id
  http_method = aws_api_gateway_method.options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

# Integration response for OPTIONS
resource "aws_api_gateway_integration_response" "options" {
  rest_api_id = var.rest_api_id
  resource_id = var.resource_id
  http_method = aws_api_gateway_method.options.http_method
  status_code = aws_api_gateway_method_response.options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${var.allowed_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'${var.allowed_methods}'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${var.allowed_origins}'"
  }

  depends_on = [aws_api_gateway_integration.options]
}
