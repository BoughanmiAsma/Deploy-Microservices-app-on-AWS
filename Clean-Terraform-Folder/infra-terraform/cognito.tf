# =============================================================================
# Authentification : Amazon Cognito (remplace Keycloak)
# =============================================================================

data "aws_region" "current" {}

# --- Groupe d'utilisateurs (equivalent du realm Keycloak) ---------------------
resource "aws_cognito_user_pool" "main" {
  name = "${local.project}-users"

  # L'e-mail sert d'identifiant de connexion
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  # false = les visiteurs peuvent creer eux-memes leur compte (inscription libre)
  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = local.tags
}

# --- Client de l'application Angular (equivalent de angular-client) ----------
resource "aws_cognito_user_pool_client" "angular" {
  name         = "angular-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Client public : une application Angular ne peut pas garder un secret
  generate_secret = false

  # Authorization Code (avec PKCE cote bibliotheque)
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = ["COGNITO"]

  # A completer avec l'adresse CloudFront quand elle existera
  callback_urls = ["https://www.websitetemplate.test"]
  logout_urls   = ["https://www.websitetemplate.test"]

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH", # pratique pour tester avec la CLI, a retirer ensuite
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  prevent_user_existence_errors = "ENABLED"

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

# --- Domaine de la page de connexion hebergee (Hosted UI) --------------------
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${local.project}-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}

# --- Groupes = roles (a aligner sur les roles du realm Keycloak) --------------
resource "aws_cognito_user_group" "roles" {
  for_each     = toset(["admin", "user"])
  name         = each.key
  user_pool_id = aws_cognito_user_pool.main.id
}

# --- Sorties ------------------------------------------------------------------
output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.angular.id
}

# Valeur pour spring...jwt.issuer-uri et pour 'authority' dans Angular (vrai AWS)
output "cognito_issuer_uri" {
  value = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "cognito_hosted_ui_domain" {
  value = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}