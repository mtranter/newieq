resource "random_password" "secret" {
  length = 64
}

locals {
  env_vars = {
    JWT_SECRET = random_password.secret.result
  }
}

module "service" {
  source              = "./../../modules/micro-service"
  service_name        = "NewieQUsers"
  source_folder       = "${path.module}/../package/dist"
  dependencies_folder = "${path.module}/../package/dependencies"
  commit_hash         = var.commit_hash
  env_vars            = local.env_vars
  sns_topics = [{
    name    = "UserEvents"
    is_fifo = true
  }]
  api_handler = {
    api_openapi_spec = "${path.module}/../package/openapi.json"
    handler          = "api.handler"
    extra_openapi_vars = {
      AUTHORIZER_FUNCTION_URI = module.authorizer.function.invoke_arn
      ROLE_ARN                = module.authorizer.api_role_arn
    }
  }
  dynamodb_table = {
    hash_key = {
      name = "hash"
      type = "S"
    }
    range_key = {
      name = "range"
      type = "S"
    }
    stream_enabled = true
    table_name     = "NewieQUsers"
  }
}

module "authorizer" {
  source = "./../../modules/api-gw-custom-authorizer"
  name   = "NewieQAuthorizer"
  source_folder       = "${path.module}/../package/dist"
  dependencies_folder = "${path.module}/../package/dependencies"
  handler             = "authorizer.index"
  env_vars            = local.env_vars
}


output "base_url" {
  value = module.service.base_url
}
