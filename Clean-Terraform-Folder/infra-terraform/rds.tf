# =============================================================================
# Etape 2 : reseau + bases MySQL (RDS) pour order-service et inventory-service
# =============================================================================

locals {
  azs = ["us-east-1a", "us-east-1b"] # RDS exige au moins 2 zones de disponibilite
}

# --- Reseau -------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.tags, { Name = "${local.project}-vpc" })
}

resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = local.azs[count.index]
  tags              = merge(local.tags, { Name = "${local.project}-private-${count.index + 1}" })
}

resource "aws_db_subnet_group" "main" {
  name       = "${local.project}-db-subnets"
  subnet_ids = aws_subnet.private[*].id
  tags       = local.tags
}

# Seul le reseau du VPC peut joindre MySQL (a restreindre plus tard au groupe de securite d'EKS)
resource "aws_security_group" "rds" {
  name        = "${local.project}-rds-sg"
  description = "Acces MySQL depuis le VPC"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "MySQL depuis le VPC"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  tags = local.tags
}

# --- RDS : order-service ------------------------------------------------------
resource "aws_db_instance" "order" {
  identifier        = "${local.project}-order-db"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_encrypted = true

  db_name  = "order_service"
  username = "order_user"
  password = var.order_db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = false # true en production
  skip_final_snapshot    = true  # false en production
  deletion_protection    = false # true en production

  tags = local.tags
}

# --- RDS : inventory-service --------------------------------------------------
resource "aws_db_instance" "inventory" {
  identifier        = "${local.project}-inventory-db"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_encrypted = true

  db_name  = "inventory_service"
  username = "inventory_user"
  password = var.inventory_db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = false
  skip_final_snapshot    = true
  deletion_protection    = false

  tags = local.tags
}

# --- Sorties ------------------------------------------------------------------
output "order_db_endpoint" {
  value = aws_db_instance.order.address
}

output "inventory_db_endpoint" {
  value = aws_db_instance.inventory.address
}