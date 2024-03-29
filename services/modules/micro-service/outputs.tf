output "base_url" {
  value = var.api_handler == null ? null : module.api[0].live_stage.invoke_url
}

output "api_id" {
  value = var.api_handler == null ? null : module.api[0].api.id
}