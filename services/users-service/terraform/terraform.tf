terraform {
  backend "s3" {
    bucket = "newieq-tf-state"
    key    = "users-service/tfstate"
    region = "ap-southeast-2"
  }
}