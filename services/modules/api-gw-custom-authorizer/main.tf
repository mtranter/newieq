# variable "api_id" {
#   type = string
# }

variable "name" {
  type = string
}

variable "source_folder" {
  type = string
}

variable "dependencies_folder" {
  type = string
}

variable "handler" {
  type = string
}

variable "env_vars" {
  type = map(string)
}

data "archive_file" "source" {
  source_dir  = var.source_folder
  output_path = "./source.zip"
  type        = "zip"
}

data "archive_file" "dependencies" {
  source_dir  = var.dependencies_folder
  output_path = "./dependencies.zip"
  type        = "zip"
}

# resource "aws_api_gateway_authorizer" "this" {
#   name                   = var.name
#   rest_api_id            = var.api_id
#   authorizer_uri         = module.function.function.invoke_arn
#   authorizer_credentials = aws_iam_role.invocation_role.arn
# }

resource "aws_iam_role" "invocation_role" {
  name = "${var.name}AuthorizerInvocationRole"
  path = "/"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "invocation_policy" {
  role = aws_iam_role.invocation_role.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "lambda:InvokeFunction",
      "Effect": "Allow",
      "Resource": "${module.function.function.arn}"
    }
  ]
}
EOF
}

resource "aws_iam_role" "lambda" {
  name = "${var.name}AuthorizerLambda"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

module "function" {
  source           = "github.com/mtranter/platform-in-a-box-aws//modules/terraform-aws-piab-lambda"
  name             = "${var.name}Authorizer"
  runtime          = "nodejs16.x"
  handler          = var.handler
  create_dlq       = false
  environment_vars = var.env_vars
  filename         = data.archive_file.source.output_path
  layers_source = {
    dependencies = data.archive_file.dependencies.output_path
  }
}

output "function" {
  value = module.function.function
}

output "api_role_arn" {
  value = aws_iam_role.invocation_role.arn
}