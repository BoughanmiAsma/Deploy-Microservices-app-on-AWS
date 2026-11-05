terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # --- LE BLOCK BACKEND DOIT ÊTRE ICI (À L'INTÉRIEUR) ---
  # backend "s3" {
  #  bucket         = "mon-tfstate-bucket"
  #  key            = "bootstrap/terraform.tfstate"
  #  region         = "us-east-1"
  #  dynamodb_table = "terraform-state-locks"

  #  endpoints = {
  #    s3       = "http://localhost:4566"
  #    dynamodb = "http://localhost:4566"
  #  }

  #  access_key                  = "mock_access_key"
  #  secret_key                  = "mock_secret_key"
  #  skip_credentials_validation = true
  #  skip_metadata_api_check     = true
  #  skip_requesting_account_id  = true
  #  skip_s3_checksum            = true
  #  use_path_style              = true
 # }
}

# Configuration du provider AWS redirigé vers Floci (Local)
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "mock_access_key"
  secret_key                  = "mock_secret_key"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  
  # Indispensable pour l'émulateur local avec S3
  s3_use_path_style           = true

  endpoints {
    s3       = "http://localhost:4566"
    dynamodb = "http://localhost:4566"
  }
}

# 1. Bucket S3 qui contiendra tous les fichiers .tfstate
resource "aws_s3_bucket" "terraform_state" {
  bucket = "mon-tfstate-bucket"
}

# 2. Table DynamoDB pour la gestion des verrous (State Locking)
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-state-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}