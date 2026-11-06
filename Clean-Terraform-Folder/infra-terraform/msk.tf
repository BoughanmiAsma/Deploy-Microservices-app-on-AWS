# =============================================================================
# Etape 3 : Kafka (MSK) pour la communication asynchrone order -> notification
# =============================================================================

resource "aws_security_group" "msk" {
  name        = "${local.project}-msk-sg"
  description = "Acces Kafka depuis le VPC"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Kafka (PLAINTEXT) depuis le VPC"
    from_port   = 9092
    to_port     = 9092
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  tags = local.tags
}

resource "aws_msk_cluster" "main" {
  cluster_name           = "${local.project}-kafka"
  kafka_version          = "3.6.0"
  number_of_broker_nodes = 2 # multiple du nombre de sous-reseaux (2)

  broker_node_group_info {
    instance_type   = "kafka.t3.small"
    client_subnets  = aws_subnet.private[*].id
    security_groups = [aws_security_group.msk.id]

    storage_info {
      ebs_storage_info {
        volume_size = 10
      }
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "PLAINTEXT" # TLS en production
      in_cluster    = true
    }
  }

  tags = local.tags
}

output "kafka_bootstrap_servers" {
  description = "Adresses a donner a spring.kafka.bootstrap-servers"
  value       = aws_msk_cluster.main.bootstrap_brokers
}