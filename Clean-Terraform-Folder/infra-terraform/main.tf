# =============================================================================
# Etape 1 : fondations (registre d'images, secrets, bucket du frontend)
# A placer dans le dossier infra/, a cote de backend.tf et providers.tf
# =============================================================================

locals {
  project = "ms-shop"

  # discovery-service (Eureka) n'est pas migre : le DNS Kubernetes le remplace
  services = [
    "api-gateway",
    "product-service",
    "order-service",
    "inventory-service",
    "notification-service",
  ]

  tags = {
    Project   = local.project
    ManagedBy = "terraform"
    Env       = "local"
  }
}

# -----------------------------------------------------------------------------
# Variables (valeurs a fournir dans terraform.tfvars, non commite)
# -----------------------------------------------------------------------------
variable "order_db_password" {
  type      = string
  sensitive = true
}

variable "inventory_db_password" {
  type      = string
  sensitive = true
}

variable "product_db_password" {
  type      = string
  sensitive = true
}

# -----------------------------------------------------------------------------
# ECR : un depot d'images Docker par service
# -----------------------------------------------------------------------------
resource "aws_ecr_repository" "services" {
  for_each             = toset(local.services)
  name                 = "${local.project}/${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true # pratique en local, a retirer en production

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.tags
}

# -----------------------------------------------------------------------------
# Secrets Manager : identifiants des bases MySQL (lus plus tard par les services)
# -----------------------------------------------------------------------------
resource "aws_secretsmanager_secret" "order_db" {
  name                    = "${local.project}/order-db"
  recovery_window_in_days = 0 # suppression immediate, utile avec un emulateur
  tags                    = local.tags
}

resource "aws_secretsmanager_secret_version" "order_db" {
  secret_id = aws_secretsmanager_secret.order_db.id
  secret_string = jsonencode({
    username = "order_user"
    password = var.order_db_password
    dbname   = "order_service"
  })
}

resource "aws_secretsmanager_secret" "inventory_db" {
  name                    = "${local.project}/inventory-db"
  recovery_window_in_days = 0
  tags                    = local.tags
}

resource "aws_secretsmanager_secret_version" "inventory_db" {
  secret_id = aws_secretsmanager_secret.inventory_db.id
  secret_string = jsonencode({
    username = "inventory_user"
    password = var.inventory_db_password
    dbname   = "inventory_service"
  })
}

# -----------------------------------------------------------------------------
# Secrets Manager : identifiants de base MongoDB (lus plus tard par les services)
# -----------------------------------------------------------------------------
resource "aws_secretsmanager_secret" "product_db" {
  name                    = "${local.project}/product-db"
  recovery_window_in_days = 0
  tags                    = local.tags
}

resource "aws_secretsmanager_secret_version" "product_db" {
  secret_id = aws_secretsmanager_secret.product_db.id
  secret_string = jsonencode({
    username = "root"
    password = var.product_db_password
    dbname   = "product-service"
  })
}
# -----------------------------------------------------------------------------
# S3 : bucket du frontend Angular (CloudFront viendra plus tard)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "frontend" {
  bucket        = "${local.project}-frontend"
  force_destroy = true
  tags          = local.tags
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------------------------------
# Sorties
# -----------------------------------------------------------------------------
output "ecr_repository_urls" {
  description = "URL de chaque depot ECR (pour docker push)"
  value       = { for name, repo in aws_ecr_repository.services : name => repo.repository_url }
}

output "frontend_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

output "secret_names" {
  value = [
    aws_secretsmanager_secret.order_db.name,
    aws_secretsmanager_secret.inventory_db.name,
  ]
}
