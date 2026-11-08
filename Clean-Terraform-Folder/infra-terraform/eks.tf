# =============================================================================
# Etape 4 : cluster Kubernetes (EKS) qui hebergera les microservices
# =============================================================================

variable "kubernetes_version" {
  type        = string
  default     = "1.31" # a ajuster selon les versions supportees par Floci / AWS
  description = "Version de Kubernetes du cluster"
}

# Avec un emulateur, les noeuds sont souvent fournis par l'emulateur lui-meme
# (k3s). Mettre true pour tester aussi le groupe de noeuds.
variable "create_node_group" {
  type    = bool
  default = false
}

# --- Role IAM du plan de controle ---------------------------------------------
resource "aws_iam_role" "eks_cluster" {
  name = "${local.project}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

# --- Cluster ------------------------------------------------------------------
resource "aws_eks_cluster" "main" {
  name     = "${local.project}-eks"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true # a restreindre en production
  }

  depends_on = [aws_iam_role_policy_attachment.eks_cluster]

  tags = local.tags
}
resource "aws_eks_addon" "ebs_csi" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "aws-ebs-csi-driver"

  depends_on = [aws_eks_cluster.main]
}

# --- Role IAM des noeuds (machines qui font tourner les pods) -----------------
resource "aws_iam_role" "eks_nodes" {
  name = "${local.project}-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "eks_nodes" {
  for_each = toset([
    "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
    "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly", # lecture des images ECR
  ])

  role       = aws_iam_role.eks_nodes.name
  policy_arn = each.value
}

# --- Groupe de noeuds (optionnel) ---------------------------------------------
resource "aws_eks_node_group" "main" {
  count = var.create_node_group ? 1 : 0

  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.project}-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = ["t3.medium"]

  scaling_config {
    desired_size = 2
    min_size     = 1
    max_size     = 3
  }

  depends_on = [aws_iam_role_policy_attachment.eks_nodes]

  tags = local.tags
}

# --- Sorties ------------------------------------------------------------------
output "eks_cluster_name" {
  value = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}